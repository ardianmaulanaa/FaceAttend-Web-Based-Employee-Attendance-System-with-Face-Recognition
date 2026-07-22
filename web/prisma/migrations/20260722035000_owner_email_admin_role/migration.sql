UPDATE `users`
SET `role` = 'admin'
WHERE LOWER(`email`) = 'owner@creativemu.com';
