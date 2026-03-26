import { prisma } from "@/lib/prisma";

// 🔎 Fonction utilitaire pour trouver le prochain siège disponible dans une table
function findNextAvailableSeat(
  players: { table_seat_number: number | null }[],
  startSeat: number = 1,
): number {
  const occupied = new Set(
    players
      .map((p) => p.table_seat_number)
      .filter((n): n is number => n !== null),
  );
  let seat = startSeat;
  while (occupied.has(seat)) {
    seat++;
  }
  return seat;
}

// 🎲 Random player sorting for rebalancing
// Fisher-Yates shuffle algorithm for true randomness
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 🎯 Helper function to determine max capacity based on category and table count
function getMaxCapacityForCategory(
  category: string,
  remainingTableCount: number,
): number {
  if (
    category === "APT" ||
    category === "SOLIPOKER" ||
    category === "SPECIAUX" ||
    category === "SUPERFINALE"
  ) {
    // APT, SOLIPOKER, SPECIAUX, SUPERFINALE: max 8 for multi-table, max 9 for single table (final table)
    return remainingTableCount === 1 ? 9 : 8;
  } else if (category === "SITANDGO") {
    return 9;
  } else {
    // Default for other categories
    return 8;
  }
}

// 📊 Type definitions for rebalancing
type TableData = {
  id: bigint;
  tableNumber: number;
  capacity: number;
  players: any[];
};

type PlayerMovement = {
  playerName: string;
  registrationId: number;
  fromTableId: number;
  fromTableNumber?: number;
  fromTableSeat?: number;
  toTableId: number;
  toTableNumber?: number;
  toTableSeat?: number;
};

type RebalanceResult = {
  changed: boolean;
  moves: PlayerMovement[];
  phase?: "closure" | "small_table" | "gap_rebalance" | "none";
  closedTables?: number[];
};

/**
 * 🎯 MAIN REBALANCING FUNCTION
 *
 * Implements strict 3-phase algorithm:
 * PHASE 1: Check possibility of TABLE CLOSURE
 * PHASE 2: Check for table with LESS THAN 4 PLAYERS
 * PHASE 3: Rebalancing if GAP ≥ 2
 *
 * CRITICAL: Sit&Go tournaments are EXCLUDED from rebalancing
 */
export async function reequilibrateTables(
  tournamentId: number,
): Promise<RebalanceResult> {
  console.log(
    "🔄 [REBALANCE] Starting rebalancing for tournament:",
    tournamentId,
  );

  // Fetch tournament data
  const tournament = await prisma.tournament.findUnique({
    where: { id: BigInt(tournamentId) },
    select: { tournament_category: true },
  });

  if (!tournament) {
    console.error("❌ [REBALANCE] Tournament not found");
    return { changed: false, moves: [], phase: "none" };
  }

  // ⚠️ CRITICAL: Sit&Go tournaments do NOT rebalance
  if (tournament.tournament_category === "SITANDGO") {
    console.log("🚫 [REBALANCE] Sit&Go tournament - NO rebalancing");
    return { changed: false, moves: [], phase: "none" };
  }

  // Fetch all tables with non-eliminated confirmed players
  const tables = await prisma.tournament_table.findMany({
    where: { tournament_id: BigInt(tournamentId) },
    include: {
      table_assignment: {
        where: {
          eliminated: false,
          registration: { statut: "Confirmed" },
        },
        include: {
          registration: {
            include: {
              wp_users: true,
            },
          },
          tournament_table: true,
        },
      },
    },
  });

  // Filter out empty tables for analysis
  const tablesWithPlayers = tables
    .filter((t) => t.table_assignment.length > 0)
    .map((table) => ({
      id: table.id,
      tableNumber: table.table_number,
      capacity: table.table_capacity,
      players: table.table_assignment,
    }));

  // SPECIAL CASE: Final table (only 1 table remaining)
  if (tablesWithPlayers.length === 1) {
    console.log("🏁 [REBALANCE] Final table - NO rebalancing needed");
    return { changed: false, moves: [], phase: "none" };
  }

  const totalPlayers = tablesWithPlayers.reduce(
    (sum, t) => sum + t.players.length,
    0,
  );
  const currentTableCount = tablesWithPlayers.length;

  console.log(
    `📊 [REBALANCE] Current state: ${totalPlayers} players, ${currentTableCount} tables`,
  );

  // ============================================================
  // PHASE 1: Check possibility of TABLE CLOSURE
  // ============================================================
  console.log("🔍 [PHASE 1] Checking table closure possibility...");

  const maxCapacity = getMaxCapacityForCategory(
    tournament.tournament_category,
    currentTableCount - 1, // Capacity after closing one table
  );

  // Check if we can close one table
  const canCloseTable = totalPlayers / (currentTableCount - 1) <= maxCapacity;

  if (canCloseTable) {
    console.log(
      `✅ [PHASE 1] Table closure possible: ${totalPlayers} / ${currentTableCount - 1} = ${totalPlayers / (currentTableCount - 1)} ≤ ${maxCapacity}`,
    );

    // Always close the LAST table (highest table number)
    const lastTable = tablesWithPlayers.reduce((max, table) =>
      table.tableNumber > max.tableNumber ? table : max,
    );

    console.log(
      `🗑️ [PHASE 1] Closing table ${lastTable.tableNumber} (${lastTable.players.length} players)`,
    );

    return await closeTableAndRedistribute(
      lastTable,
      tablesWithPlayers.filter((t) => t.id !== lastTable.id),
      maxCapacity,
      "closure",
    );
  }

  console.log(
    `❌ [PHASE 1] Table closure NOT possible: ${totalPlayers} / ${currentTableCount - 1} = ${totalPlayers / (currentTableCount - 1)} > ${maxCapacity}`,
  );

  // ============================================================
  // PHASE 2: Check for table with LESS THAN 4 PLAYERS
  // ============================================================
  console.log("🔍 [PHASE 2] Checking for small tables (< 4 players)...");

  const smallTables = tablesWithPlayers.filter((t) => t.players.length < 4);

  if (smallTables.length > 0) {
    // Sort by player count (ascending), then by table number (descending)
    // This prioritizes closing the weakest table with highest number
    smallTables.sort((a, b) => {
      const playerDiff = a.players.length - b.players.length;
      if (playerDiff !== 0) return playerDiff;
      return b.tableNumber - a.tableNumber;
    });

    const tableToClose = smallTables[0];
    console.log(
      `⚠️ [PHASE 2] Found small table ${tableToClose.tableNumber} with ${tableToClose.players.length} players`,
    );

    // Check if we can close this table
    const remainingTables = tablesWithPlayers.filter(
      (t) => t.id !== tableToClose.id,
    );
    const maxCapacityAfterClosure = getMaxCapacityForCategory(
      tournament.tournament_category,
      remainingTables.length,
    );

    const totalPlayersAfterClosure =
      remainingTables.reduce((sum, t) => sum + t.players.length, 0) +
      tableToClose.players.length;

    const canCloseSmallTable =
      totalPlayersAfterClosure / remainingTables.length <=
      maxCapacityAfterClosure;

    if (canCloseSmallTable) {
      console.log(
        `✅ [PHASE 2] Closing small table ${tableToClose.tableNumber}`,
      );
      return await closeTableAndRedistribute(
        tableToClose,
        remainingTables,
        maxCapacityAfterClosure,
        "small_table",
      );
    } else {
      console.log(
        `❌ [PHASE 2] Cannot close small table - would exceed capacity`,
      );
    }
  } else {
    console.log("✅ [PHASE 2] No small tables found");
  }

  // ============================================================
  // PHASE 3: Rebalancing if GAP ≥ 2
  // ============================================================
  console.log("🔍 [PHASE 3] Checking gap-based rebalancing...");

  const playerCounts = tablesWithPlayers.map((t) => t.players.length);
  const maxPlayers = Math.max(...playerCounts);
  const minPlayers = Math.min(...playerCounts);
  const gap = maxPlayers - minPlayers;

  console.log(
    `📊 [PHASE 3] Gap analysis: max=${maxPlayers}, min=${minPlayers}, gap=${gap}`,
  );

  if (gap < 2) {
    console.log(
      `✅ [PHASE 3] Gap acceptable (${gap} < 2) - NO rebalancing needed`,
    );
    return { changed: false, moves: [], phase: "none" };
  }

  console.log(`⚠️ [PHASE 3] Gap too large (${gap} ≥ 2) - Rebalancing required`);

  return await performGapRebalancing(
    tablesWithPlayers,
    tournament.tournament_category,
    gap,
  );
}

/**
 * 🗑️ Close a table and redistribute its players
 */
async function closeTableAndRedistribute(
  tableToClose: TableData,
  remainingTables: TableData[],
  maxCapacity: number,
  phase: "closure" | "small_table",
): Promise<RebalanceResult> {
  const moves: PlayerMovement[] = [];

  // 🎯 FINAL TABLE SHUFFLE: When closing leaves exactly 1 table
  if (remainingTables.length === 1) {
    console.log(
      `🎲 [FINAL TABLE SHUFFLE] Closing table ${tableToClose.tableNumber} leaves exactly 1 table - shuffling ALL players`,
    );

    // Get tournament category to check for SITANDGO exclusion
    const tableRecord = await prisma.tournament_table.findUnique({
      where: { id: tableToClose.id },
      include: {
        tournament: {
          select: { tournament_category: true },
        },
      },
    });

    const tournamentCategory = tableRecord?.tournament?.tournament_category;

    // SITANDGO tournaments skip the shuffle (already handled by early return)
    if (tournamentCategory === "SITANDGO") {
      console.log(
        "🚫 [FINAL TABLE SHUFFLE] Sit&Go category - skipping shuffle",
      );
      // Fall through to normal redistribution logic below
    } else {
      // ✅ APPLY FINAL TABLE SHUFFLE for APT, SOLIPOKER, SPECIAUX, SUPERFINALE
      const finalTable = remainingTables[0];

      // 1️⃣ Combine ALL players from BOTH tables
      const allFinalPlayers = [...finalTable.players, ...tableToClose.players];

      console.log(
        `  🎯 Total players for shuffle: ${allFinalPlayers.length} (${finalTable.players.length} from T${finalTable.tableNumber} + ${tableToClose.players.length} from T${tableToClose.tableNumber})`,
      );

      // 2️⃣ SHUFFLE ALL players randomly
      const shuffledPlayers = shuffleArray(allFinalPlayers);

      // 3️⃣ Reassign sequential seats 1, 2, 3... on final table
      for (let i = 0; i < shuffledPlayers.length; i++) {
        const player = shuffledPlayers[i];
        const fromTableId = player.table_id;
        const fromTableNumber = player.tournament_table?.table_number;
        const fromTableSeat = player.table_seat_number ?? null;
        const newSeatNumber = i + 1;

        await prisma.table_assignment.update({
          where: { id: player.id },
          data: {
            table_id: finalTable.id,
            table_seat_number: newSeatNumber,
          },
        });

        moves.push({
          playerName: player.registration?.wp_users?.display_name ?? "??",
          registrationId: Number(player.registration_id),
          fromTableId: Number(fromTableId),
          fromTableNumber,
          fromTableSeat,
          toTableId: Number(finalTable.id),
          toTableNumber: finalTable.tableNumber,
          toTableSeat: newSeatNumber,
        });

        console.log(
          `  🎲 ${player.registration?.wp_users?.display_name} → T${finalTable.tableNumber} Seat ${newSeatNumber} (from T${fromTableNumber} S${fromTableSeat})`,
        );
      }

      // 4️⃣ Delete the closing table
      await prisma.tournament_table.delete({ where: { id: tableToClose.id } });

      console.log(
        `✅ [FINAL TABLE SHUFFLE] All ${shuffledPlayers.length} players shuffled on T${finalTable.tableNumber}, T${tableToClose.tableNumber} deleted`,
      );

      return {
        changed: true,
        moves,
        phase: "closure",
        closedTables: [tableToClose.tableNumber],
      };
    }
  }

  // ============================================================
  // NORMAL REDISTRIBUTION LOGIC (non-final-table or SITANDGO)
  // ============================================================

  // Shuffle players for random redistribution
  const playersToRedistribute = shuffleArray(tableToClose.players);

  // Sort remaining tables by player count (ascending) - fill emptiest first
  remainingTables.sort((a, b) => a.players.length - b.players.length);

  console.log(
    `📦 [${phase.toUpperCase()}] Redistributing ${playersToRedistribute.length} players from table ${tableToClose.tableNumber}`,
  );

  // Redistribute players
  for (const player of playersToRedistribute) {
    const fromTableId = player.table_id;
    const fromTableNumber = player.tournament_table?.table_number;
    const fromTableSeat = player.table_seat_number ?? null;

    // Find the table with the fewest players that hasn't reached max capacity
    const targetTable = remainingTables.find(
      (t) => t.players.length < maxCapacity,
    );

    if (!targetTable) {
      console.error("❌ No available table for redistribution - logic error");
      break;
    }

    const nextSeat = findNextAvailableSeat(targetTable.players);

    await prisma.table_assignment.update({
      where: { id: player.id },
      data: {
        table_id: targetTable.id,
        table_seat_number: nextSeat,
      },
    });

    // Update local state
    targetTable.players.push({
      ...player,
      table_id: targetTable.id,
      table_seat_number: nextSeat,
    });

    // Re-sort after adding a player to maintain emptiest-first order
    remainingTables.sort((a, b) => a.players.length - b.players.length);

    moves.push({
      playerName: player.registration?.wp_users?.display_name ?? "??",
      registrationId: Number(player.registration_id),
      fromTableId: Number(fromTableId),
      fromTableNumber,
      fromTableSeat,
      toTableId: Number(targetTable.id),
      toTableNumber: targetTable.tableNumber,
      toTableSeat: nextSeat,
    });

    console.log(
      `  ➡️ ${player.registration?.wp_users?.display_name} moved from T${fromTableNumber} to T${targetTable.tableNumber}`,
    );
  }

  // Delete the closed table
  await prisma.tournament_table.delete({ where: { id: tableToClose.id } });

  console.log(
    `✅ [${phase.toUpperCase()}] Table ${tableToClose.tableNumber} closed successfully`,
  );

  return {
    changed: true,
    moves,
    phase,
    closedTables: [tableToClose.tableNumber],
  };
}

/**
 * ⚖️ Perform gap-based rebalancing (Phase 3)
 */
async function performGapRebalancing(
  tablesWithPlayers: TableData[],
  _category: string,
  _initialGap: number,
): Promise<RebalanceResult> {
  const moves: PlayerMovement[] = [];
  let iterations = 0;
  const MAX_ITERATIONS = 10; // Safety limit

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    // Sort tables by player count
    tablesWithPlayers.sort((a, b) => a.players.length - b.players.length);

    const minTable = tablesWithPlayers[0];
    const maxTable = tablesWithPlayers[tablesWithPlayers.length - 1];
    const currentGap = maxTable.players.length - minTable.players.length;

    console.log(
      `  🔄 [ITERATION ${iterations}] Gap: ${currentGap}, Min: T${minTable.tableNumber}(${minTable.players.length}), Max: T${maxTable.tableNumber}(${maxTable.players.length})`,
    );

    if (currentGap < 2) {
      console.log(`  ✅ Gap acceptable (${currentGap} < 2) - Stopping`);
      break;
    }

    // Find ALL tables with maximum players (for random selection)
    const fullTables = tablesWithPlayers.filter(
      (t) => t.players.length === maxTable.players.length,
    );

    // Find ALL tables with minimum players (for random selection)
    const emptyTables = tablesWithPlayers.filter(
      (t) => t.players.length === minTable.players.length,
    );

    // 🎲 RANDOM selection of source and target tables
    const shuffledFullTables = shuffleArray(fullTables);
    const shuffledEmptyTables = shuffleArray(emptyTables);

    const sourceTable = shuffledFullTables[0];
    const targetTable = shuffledEmptyTables[0];

    // 🎲 RANDOM selection of player from source table
    const randomIndex = Math.floor(Math.random() * sourceTable.players.length);
    const [movedPlayer] = sourceTable.players.splice(randomIndex, 1);

    if (!movedPlayer) {
      console.error("❌ No player to move - breaking");
      break;
    }

    const fromTableId = sourceTable.id;
    const fromTableNumber = sourceTable.tableNumber;
    const fromTableSeat = movedPlayer.table_seat_number ?? null;
    const nextSeat = findNextAvailableSeat(targetTable.players);

    await prisma.table_assignment.update({
      where: { id: movedPlayer.id },
      data: {
        table_id: targetTable.id,
        table_seat_number: nextSeat,
      },
    });

    targetTable.players.push({
      ...movedPlayer,
      table_id: targetTable.id,
      table_seat_number: nextSeat,
    });

    moves.push({
      playerName: movedPlayer.registration?.wp_users?.display_name ?? "??",
      registrationId: Number(movedPlayer.registration_id),
      fromTableId: Number(fromTableId),
      fromTableNumber,
      fromTableSeat,
      toTableId: Number(targetTable.id),
      toTableNumber: targetTable.tableNumber,
      toTableSeat: nextSeat,
    });

    console.log(
      `  ➡️ ${movedPlayer.registration?.wp_users?.display_name} moved from T${fromTableNumber} to T${targetTable.tableNumber}`,
    );
  }

  if (iterations >= MAX_ITERATIONS) {
    console.warn(`⚠️ [PHASE 3] Reached max iterations (${MAX_ITERATIONS})`);
  }

  console.log(
    `✅ [PHASE 3] Gap rebalancing complete after ${iterations} iterations`,
  );

  return {
    changed: moves.length > 0,
    moves,
    phase: "gap_rebalance",
  };
}
