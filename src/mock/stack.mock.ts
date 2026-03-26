import { chipMocks } from "./chip.mock";

export const stackMock = [
  {
    id: "1",
    name: "Stack 1",
    chips: [
      chipMocks[0],
      chipMocks[1],
      chipMocks[2],
      chipMocks[3],
      chipMocks[4]
    ]
  },
  {
    id: "2",
    name: "Stack 2",
    chips: [chipMocks[2], chipMocks[3], chipMocks[4]]
  },
  {
    id: "3",
    name: "Stack 3",
    chips: [chipMocks[0], chipMocks[1], chipMocks[3], chipMocks[4]]
  },
  {
    id: "4",
    name: "Stack 4",
    chips: [chipMocks[0], chipMocks[1], chipMocks[2]]
  }
];
