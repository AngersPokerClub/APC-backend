export const usersMock = Array.from({ length: 20 }).map((_, index) => {
  const id = index + 1;
  return {
    id: id,
    user_login: `user${id}`,
    user_pass: `hashed_password_${id}`,
    user_nicename: `User Nice ${id}`,
    user_email: `user${id}@example.com`,
    user_url: `https://example.com/user${id}`,
    user_registered: `2024-01-${String((id % 30) + 1).padStart(
      2,
      "0"
    )} 12:00:00`,
    user_activation_key: `activation_key_${id}`,
    user_status: 0,
    display_name: `User Display ${id}`,
    pseudo_winamax: `Winamax${id}`,
    photo_url: "/images/ellipseAvatar.png"
  };
});
