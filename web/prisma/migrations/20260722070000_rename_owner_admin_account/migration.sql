UPDATE `users`
SET
  `name` = 'Admin Creativemu',
  `email` = 'admin@creativemu.com',
  `role` = 'admin',
  `status` = 'active'
WHERE LOWER(`email`) = 'owner@creativemu.com';
