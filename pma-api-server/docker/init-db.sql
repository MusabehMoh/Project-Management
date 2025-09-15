-- Create database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'PMA')
BEGIN
    CREATE DATABASE [PMA];
END
GO

USE [PMA];
GO

-- Create tables will be handled by EF Core migrations
-- This file can be used for additional seed data if needed