// Import Prisma client
const { PrismaClient } = require('@prisma/client');
const earnDb = new PrismaClient();

async function main() {
  console.log('🌱 Starting earn database seeding...');

  // Clean existing data (only core tables needed for seeding)
  try {
    // Only delete tables that are essential for the seed data
    await earnDb.submission.deleteMany();
    await earnDb.grantApplication.deleteMany();
    await earnDb.subscribeBounty.deleteMany();
    await earnDb.userSponsors.deleteMany();
    await earnDb.bounties.deleteMany();
    await earnDb.grants.deleteMany();
    await earnDb.hackathon.deleteMany();
    await earnDb.user.deleteMany();
    await earnDb.sponsors.deleteMany();
    
    console.log('🗑️  Cleaned existing core data');
  } catch (error) {
    console.log('⚠️  Some tables may not exist yet, continuing with seeding...');
  }

  // Create sponsors
  const sponsors = await Promise.all([
    earnDb.sponsors.create({
      data: {
        name: 'Solana Foundation',
        slug: 'solana-foundation',
        logo: 'https://example.com/solana-logo.png',
        url: 'https://solana.org',
        industry: 'Blockchain',
        twitter: '@solana',
        bio: 'Supporting the growth and development of the Solana ecosystem',
        isVerified: true,
        st: true,
        entityName: 'Solana Foundation Inc.',
        verificationInfo: {
          verified: true,
          verifiedAt: new Date().toISOString(),
          verifiedBy: 'admin'
        }
      }
    }),
    earnDb.sponsors.create({
      data: {
        name: 'Magic Eden',
        slug: 'magic-eden',
        logo: 'https://example.com/magic-eden-logo.png',
        url: 'https://magiceden.io',
        industry: 'NFT Marketplace',
        twitter: '@MagicEden',
        bio: 'Leading NFT marketplace on Solana',
        isVerified: true,
        st: false,
        entityName: 'Magic Eden Inc.'
      }
    }),
    earnDb.sponsors.create({
      data: {
        name: 'Superteam',
        slug: 'superteam',
        logo: 'https://example.com/superteam-logo.png',
        url: 'https://superteam.fun',
        industry: 'DAO',
        twitter: '@SuperteamDAO',
        bio: 'Global collective of creatives, operators, and developers building the future on Solana',
        isVerified: true,
        st: true,
        entityName: 'Superteam DAO'
      }
    })
  ]);

  console.log('✅ Created sponsors');

  // Create users
  const users = await Promise.all([
    earnDb.user.create({
      data: {
        email: 'john.dev@example.com',
        username: 'johndev',
        firstName: 'John',
        lastName: 'Developer',
        photo: 'https://example.com/avatar1.jpg',
        bio: 'Full-stack developer passionate about blockchain and DeFi',
        twitter: '@johndev',
        github: 'johndev',
        linkedin: 'john-developer',
        location: 'San Francisco, CA',
        skills: ['JavaScript', 'React', 'Solana', 'Rust', 'Smart Contracts'],
        experience: 'Senior',
        cryptoExperience: 'Expert',
        workPrefernce: 'fulltime',
        currentEmployer: 'Tech Startup',
        isVerified: true,
        isTalentFilled: true,
        privyDid: 'did:privy:john-dev-12345',
        currentSponsorId: sponsors[0].id,
        acceptedTOS: true
      }
    }),
    earnDb.user.create({
      data: {
        email: 'alice.designer@example.com',
        username: 'alicedesigns',
        firstName: 'Alice',
        lastName: 'Designer',
        photo: 'https://example.com/avatar2.jpg',
        bio: 'UI/UX designer specializing in Web3 interfaces',
        twitter: '@alicedesigns',
        github: 'alicedesigns',
        linkedin: 'alice-designer',
        location: 'New York, NY',
        skills: ['UI/UX Design', 'Figma', 'Prototyping', 'Design Systems'],
        experience: 'Mid',
        cryptoExperience: 'Intermediate',
        workPrefernce: 'parttime',
        isVerified: true,
        isTalentFilled: true,
        privyDid: 'did:privy:alice-designer-67890',
        acceptedTOS: true
      }
    }),
    earnDb.user.create({
      data: {
        email: 'bob.blockchain@example.com',
        username: 'bobblockchain',
        firstName: 'Bob',
        lastName: 'Wilson',
        photo: 'https://example.com/avatar3.jpg',
        bio: 'Blockchain engineer with expertise in Solana development',
        twitter: '@bobblockchain',
        github: 'bobwilson',
        location: 'Austin, TX',
        skills: ['Rust', 'Solana', 'Anchor', 'Web3.js', 'TypeScript'],
        experience: 'Senior',
        cryptoExperience: 'Expert',
        workPrefernce: 'fulltime',
        isVerified: true,
        isTalentFilled: true,
        privyDid: 'did:privy:bob-blockchain-11111',
        currentSponsorId: sponsors[1].id,
        acceptedTOS: true
      }
    })
  ]);

  console.log('✅ Created users');

  // Create hackathon
  const hackathon = await earnDb.hackathon.create({
    data: {
      slug: 'solana-spring-hackathon-2024',
      name: 'Solana Spring Hackathon 2024',
      logo: 'https://example.com/hackathon-logo.png',
      description: 'Build the future of DeFi on Solana',
      sponsorId: sponsors[0].id,
      startDate: new Date('2024-03-01'),
      deadline: new Date('2024-03-31'),
      announceDate: new Date('2024-04-07'),
      eligibility: {
        requirements: ['Open to all developers', 'Project must be built on Solana'],
        regions: ['GLOBAL']
      }
    }
  });

  console.log('✅ Created hackathon');

  // Create bounties
  const bounties = await Promise.all([
    earnDb.bounties.create({
      data: {
        title: 'Build a DeFi Lending Protocol on Solana',
        slug: 'defi-lending-protocol-solana',
        description: 'Create a decentralized lending protocol with automated liquidation, variable interest rates, and governance token integration.',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'OPEN',
        token: 'USDC',
        rewardAmount: 5000,
        usdValue: 5000,
        sponsorId: sponsors[0].id,
        pocId: users[0].id,
        skills: ['Rust', 'Solana', 'DeFi', 'Smart Contracts', 'Anchor'],
        type: 'bounty',
        requirements: 'Must include comprehensive tests, documentation, and deployment scripts',
        region: 'GLOBAL',
        compensationType: 'fixed',
        isPublished: true,
        isFeatured: true,
        isActive: true,
        publishedAt: new Date(),
        applicationType: 'rolling',
        timeToComplete: '4-6 weeks',
        references: {
          examples: ['Aave', 'Compound', 'Mango Markets'],
          docs: ['https://docs.solana.com', 'https://project-serum.github.io/anchor/']
        }
      }
    }),
    earnDb.bounties.create({
      data: {
        title: 'Design NFT Marketplace User Interface',
        slug: 'nft-marketplace-ui-design',
        description: 'Design a modern, user-friendly interface for an NFT marketplace with focus on discovery, trading, and portfolio management.',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: 'OPEN',
        token: 'SOL',
        rewardAmount: 2500,
        usdValue: 2500,
        sponsorId: sponsors[1].id,
        pocId: users[1].id,
        skills: ['UI/UX Design', 'Figma', 'Design Systems', 'Prototyping'],
        type: 'project',
        requirements: 'Deliver high-fidelity mockups, interactive prototype, and design system components',
        region: 'GLOBAL',
        compensationType: 'fixed',
        isPublished: true,
        isFeatured: true,
        isActive: true,
        publishedAt: new Date(),
        applicationType: 'fixed',
        timeToComplete: '2-3 weeks'
      }
    }),
    earnDb.bounties.create({
      data: {
        title: 'Superteam Spring Challenge',
        slug: 'superteam-spring-challenge',
        description: 'Build innovative tools and applications for the Solana ecosystem.',
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        status: 'OPEN',
        token: 'USDC',
        rewardAmount: 10000,
        rewards: {
          first: 5000,
          second: 3000,
          third: 2000
        },
        usdValue: 10000,
        maxBonusSpots: 3,
        sponsorId: sponsors[2].id,
        pocId: users[2].id,
        skills: ['JavaScript', 'Rust', 'Solana', 'Web3', 'DeFi'],
        type: 'hackathon',
        requirements: 'Open source project with comprehensive documentation',
        region: 'GLOBAL',
        compensationType: 'fixed',
        isPublished: true,
        isFeatured: true,
        isActive: true,
        hackathonprize: true,
        hackathonId: hackathon.id,
        publishedAt: new Date(),
        applicationType: 'fixed',
        timeToComplete: '6-8 weeks'
      }
    })
  ]);

  console.log('✅ Created bounties');

  // Create grants
  const grants = await Promise.all([
    earnDb.grants.create({
      data: {
        title: 'Solana Developer Tools Grant',
        slug: 'solana-developer-tools-grant',
        description: 'Support for building developer tools and infrastructure for the Solana ecosystem',
        shortDescription: 'Fund innovative developer tools that enhance the Solana development experience',
        token: 'SOL',
        minReward: 1000,
        maxReward: 25000,
        sponsorId: sponsors[0].id,
        pocId: users[0].id,
        skills: ['Rust', 'JavaScript', 'Solana', 'Developer Tools'],
        logo: 'https://example.com/grant-logo.png',
        region: 'GLOBAL',
        status: 'OPEN',
        isPublished: true,
        isActive: true,
        avgResponseTime: '7d',
        isNative: true,
        questions: [
          {
            question: 'Describe your proposed developer tool',
            type: 'text',
            required: true
          },
          {
            question: 'What problem does it solve?',
            type: 'textarea',
            required: true
          }
        ]
      }
    })
  ]);

  console.log('✅ Created grants');

  // Create submissions
  const submissions = await Promise.all([
    earnDb.submission.create({
      data: {
        link: 'https://github.com/johndev/defi-lending-protocol',
        tweet: 'https://twitter.com/johndev/status/1234567890',
        status: 'Pending',
        userId: users[0].id,
        listingId: bounties[0].id,
        eligibilityAnswers: [
          { question: 'Do you have Solana development experience?', answer: 'Yes, 3+ years' },
          { question: 'Can you complete this in 4-6 weeks?', answer: 'Yes' }
        ],
        otherInfo: 'I have extensive experience building DeFi protocols and would love to contribute to the Solana ecosystem.',
        ask: 5000,
        label: 'High_Quality'
      }
    }),
    earnDb.submission.create({
      data: {
        link: 'https://figma.com/alice-nft-marketplace-design',
        status: 'Approved',
        userId: users[1].id,
        listingId: bounties[1].id,
        isWinner: true,
        winnerPosition: 1,
        isPaid: true,
        rewardInUSD: 2500,
        eligibilityAnswers: [
          { question: 'Portfolio link?', answer: 'https://alicedesigns.com' },
          { question: 'Experience with NFT marketplaces?', answer: 'Yes, designed for 3 marketplaces' }
        ],
        label: 'High_Quality'
      }
    })
  ]);

  console.log('✅ Created submissions');

  // Create grant applications
  const grantApplications = await earnDb.grantApplication.create({
    data: {
      userId: users[2].id,
      grantId: grants[0].id,
      applicationStatus: 'Pending',
      projectTitle: 'Solana Code Generator',
      projectOneLiner: 'AI-powered tool to generate Solana smart contract boilerplate',
      projectDetails: 'A comprehensive tool that helps developers quickly scaffold Solana programs with best practices, testing setup, and deployment scripts.',
      projectTimeline: '3 months development, 1 month testing and refinement',
      proofOfWork: 'Previous work: Built 5+ Solana programs, contributed to Anchor framework',
      walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      twitter: '@bobblockchain',
      github: 'bobwilson',
      ask: 15000,
      answers: [
        { question: 'Describe your proposed developer tool', answer: 'AI-powered code generator for Solana' },
        { question: 'What problem does it solve?', answer: 'Reduces time to scaffold new Solana projects' }
      ]
    }
  });

  console.log('✅ Created grant application');

  // Create user sponsors relationships
  await earnDb.userSponsors.createMany({
    data: [
      {
        userId: users[0].id,
        sponsorId: sponsors[0].id,
        role: 'MEMBER'
      },
      {
        userId: users[2].id,
        sponsorId: sponsors[1].id,
        role: 'MEMBER'
      }
    ]
  });

  console.log('✅ Created user-sponsor relationships');

  // Create subscribe bounty entries
  await earnDb.subscribeBounty.createMany({
    data: [
      {
        userId: users[0].id,
        bountyId: bounties[1].id
      },
      {
        userId: users[1].id,
        bountyId: bounties[0].id
      },
      {
        userId: users[2].id,
        bountyId: bounties[2].id
      }
    ]
  });

  console.log('✅ Created bounty subscriptions');

  // Create talent rankings
  await earnDb.talentRankings.createMany({
    data: [
      {
        userId: users[0].id,
        skill: 'DEVELOPMENT',
        timeframe: 'ALL_TIME',
        rank: 15,
        submissions: 8,
        winRate: 62,
        wins: 5,
        totalEarnedInUSD: 15000
      },
      {
        userId: users[1].id,
        skill: 'DESIGN',
        timeframe: 'ALL_TIME',
        rank: 8,
        submissions: 12,
        winRate: 75,
        wins: 9,
        totalEarnedInUSD: 22000
      },
      {
        userId: users[2].id,
        skill: 'DEVELOPMENT',
        timeframe: 'ALL_TIME',
        rank: 5,
        submissions: 15,
        winRate: 80,
        wins: 12,
        totalEarnedInUSD: 35000
      }
    ]
  });

  console.log('✅ Created talent rankings');

  // Create email logs
  await earnDb.emailLogs.createMany({
    data: [
      {
        email: 'john.dev@example.com',
        type: 'NEW_LISTING',
        bountyId: bounties[0].id,
        userId: users[0].id
      },
      {
        email: 'alice.designer@example.com',
        type: 'BOUNTY_DEADLINE',
        bountyId: bounties[1].id,
        userId: users[1].id
      }
    ]
  });

  console.log('✅ Created email logs');

  console.log('🎉 Earn database seeding completed successfully!');
  
  // Print summary
  console.log('\n📊 Earn Seeding Summary:');
  console.log(`   • ${sponsors.length} sponsors created`);
  console.log(`   • ${users.length} users created`);
  console.log(`   • 1 hackathon created`);
  console.log(`   • ${bounties.length} bounties created`);
  console.log(`   • ${grants.length} grants created`);
  console.log(`   • ${submissions.length} submissions created`);
  console.log(`   • 1 grant application created`);
  console.log(`   • 2 user-sponsor relationships created`);
  console.log(`   • 3 bounty subscriptions created`);
  console.log(`   • 3 talent rankings created`);
  console.log(`   • 2 email logs created`);
}

main()
  .then(async () => {
    await earnDb.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during earn seeding:', e);
    await earnDb.$disconnect();
    process.exit(1);
  });