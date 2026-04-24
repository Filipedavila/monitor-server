CREATE DATABASE IF NOT EXISTS Accessibility;
USE Accessibility;

CREATE USER IF NOT EXISTS 'accessmonitor'@'%' IDENTIFIED WITH mysql_native_password BY 'v2password';
GRANT ALL PRIVILEGES ON Accessibility.* TO 'accessmonitor'@'%';
FLUSH PRIVILEGES;