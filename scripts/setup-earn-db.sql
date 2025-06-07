-- Create Earn Database Schema (MySQL)
-- Based on https://github.com/SuperteamDAO/earn/blob/main/prisma/schema.prisma

USE earn_database;

-- Create User table
CREATE TABLE IF NOT EXISTS User (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE,
    firstName VARCHAR(255),
    lastName VARCHAR(255),
    location VARCHAR(255),
    skills JSON,
    notifications JSON,
    emailVerified DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Sponsors table
CREATE TABLE IF NOT EXISTS Sponsors (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) UNIQUE NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create status enum
-- MySQL doesn't have ENUMs like PostgreSQL, so we use CHECK constraint
CREATE TABLE IF NOT EXISTS Bounties (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(500) NOT NULL,
    description LONGTEXT,
    deadline DATETIME,
    skills JSON,
    eligibility JSON,
    sponsorId VARCHAR(36) NOT NULL,
    token VARCHAR(50),
    rewardAmount DECIMAL(20,8),
    rewards JSON,
    status ENUM('OPEN', 'REVIEW', 'CLOSED', 'VERIFYING', 'VERIFY_FAIL') DEFAULT 'OPEN',
    type VARCHAR(50) DEFAULT 'bounty',
    slug VARCHAR(255) DEFAULT '',
    publishedAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sponsorId) REFERENCES Sponsors(id)
);

-- Create Submission table
CREATE TABLE IF NOT EXISTS Submission (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    userId VARCHAR(36) NOT NULL,
    listingId VARCHAR(36) NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    isWinner BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id),
    FOREIGN KEY (listingId) REFERENCES Bounties(id)
);

-- Insert sample data for testing

-- Insert sample sponsors
INSERT INTO Sponsors (id, name) VALUES 
('sponsor-1', 'Solana Foundation'),
('sponsor-2', 'Phantom Wallet'),
('sponsor-3', 'Magic Eden'),
('sponsor-4', 'Superteam'),
('sponsor-5', 'Jupiter Exchange')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert sample users
INSERT INTO User (id, email, username, firstName, lastName, location, skills) VALUES 
('user-1', 'alice@example.com', 'alice_dev', 'Alice', 'Developer', 'India', '["react", "typescript", "web3"]'),
('user-2', 'bob@example.com', 'bob_designer', 'Bob', 'Designer', 'United States', '["design", "figma", "ui-ux"]'),
('user-3', 'charlie@example.com', 'charlie_rust', 'Charlie', 'Rustacean', 'Global', '["rust", "solana", "smart-contracts"]')
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- Insert sample bounties (with different timestamps for testing 12-hour delay)
-- Some published 12+ hours ago (should trigger notifications)
INSERT INTO Bounties (id, title, sponsorId, deadline, skills, eligibility, token, rewardAmount, rewards, status, type, slug, publishedAt) VALUES 
-- Published 13 hours ago - should trigger notification
('bounty-1', 'Build a DeFi Dashboard for Solana', 'sponsor-1', DATE_ADD(NOW(), INTERVAL 30 DAY), 
 '["react", "typescript", "web3", "solana"]', 
 '{"location": ["Global"], "minExperience": 1}', 
 'USDC', 5000, 
 '{"type": "fixed", "amount": 5000, "token": "USDC"}', 
 'OPEN', 'bounty', 'defi-dashboard-solana', DATE_SUB(NOW(), INTERVAL 13 HOUR)),

-- Published 12.5 hours ago - should trigger notification
('bounty-2', 'Smart Contract Security Audit', 'sponsor-2', DATE_ADD(NOW(), INTERVAL 45 DAY), 
 '["rust", "solana", "security", "smart-contracts"]', 
 '{"location": ["United States", "Europe", "India"], "minExperience": 2}', 
 NULL, NULL,
 '{"type": "range", "minAmount": 10000, "maxAmount": 25000, "token": "USDC"}', 
 'OPEN', 'project', 'smart-contract-audit', DATE_SUB(NOW(), INTERVAL 750 MINUTE)),

-- Published 11 hours ago - should NOT trigger yet
('bounty-3', 'NFT Marketplace UI/UX Design', 'sponsor-3', DATE_ADD(NOW(), INTERVAL 14 DAY), 
 '["design", "figma", "ui-ux", "nft"]', 
 '{"location": ["Global"]}', 
 'SOL', 150,
 '{"type": "fixed", "amount": 150, "token": "SOL", "usdValue": 3000}', 
 'OPEN', 'bounty', 'nft-marketplace-design', DATE_SUB(NOW(), INTERVAL 11 HOUR)),

-- Published 24 hours ago - already passed notification window
('bounty-4', 'Build a Mobile Wallet App', 'sponsor-4', DATE_ADD(NOW(), INTERVAL 60 DAY), 
 '["react-native", "typescript", "mobile", "web3"]', 
 '{"location": ["India", "Singapore", "Vietnam"]}', 
 NULL, NULL,
 '{"type": "variable", "description": "Variable compensation based on experience"}', 
 'OPEN', 'project', 'mobile-wallet-app', DATE_SUB(NOW(), INTERVAL 24 HOUR)),

-- Published just now - should NOT trigger for 12 hours
('bounty-5', 'DeFi Protocol Documentation', 'sponsor-5', DATE_ADD(NOW(), INTERVAL 7 DAY), 
 '["technical-writing", "defi", "documentation"]', 
 '{"location": ["Global"]}', 
 'USDC', 500,
 '{"type": "fixed", "amount": 500, "token": "USDC"}', 
 'OPEN', 'bounty', 'defi-documentation', NOW());

-- Create indexes for performance
CREATE INDEX idx_bounties_published ON Bounties(publishedAt);
CREATE INDEX idx_bounties_status ON Bounties(status);
CREATE INDEX idx_user_location ON User(location);

SELECT 'Earn database setup complete!' as message;