/**
 * Comprehensive realistic seed data for Phase 2: Event Discovery
 */
const getSeedEvents = (organizerId) => {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  return [
    {
      title: 'Global AI & Deep Learning Summit 2026',
      description: 'Join leading researchers, AI engineers, and industry leaders discussing Agentic AI, Large Multimodal Models, and the future of enterprise intelligence. Includes keynote speeches, hands-on lab sessions, and networking dinner.',
      category: 'Technology',
      venue: 'Palace Convention Center, Grand Ballroom',
      city: 'Bengaluru',
      startDateTime: new Date(now.getTime() + 5 * day + 9 * 3600 * 1000),
      endDateTime: new Date(now.getTime() + 6 * day + 18 * 3600 * 1000),
      bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      organizer: organizerId,
      status: 'published',
      ticketTypes: [
        { name: 'Early Bird Pass', price: 99, totalQuantity: 150, soldQuantity: 145 },
        { name: 'Standard Conference', price: 199, totalQuantity: 300, soldQuantity: 88 },
        { name: 'VIP & Executive Dinner', price: 449, totalQuantity: 50, soldQuantity: 24 }
      ]
    },
    {
      title: 'Neon Horizon Electronic Music Festival',
      description: 'An electrifying two-day outdoor music festival featuring world-renowned electronic, synthwave, and techno artists with immersive visual laser stages and art installations.',
      category: 'Music',
      venue: 'Bayfront Open Air Grounds',
      city: 'Mumbai',
      startDateTime: new Date(now.getTime() + 12 * day + 16 * 3600 * 1000),
      endDateTime: new Date(now.getTime() + 14 * day + 2 * 3600 * 1000),
      bannerImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
      organizer: organizerId,
      status: 'published',
      ticketTypes: [
        { name: 'General Admission - 2 Day', price: 79, totalQuantity: 1000, soldQuantity: 620 },
        { name: 'VIP Fan Pit Pass', price: 189, totalQuantity: 200, soldQuantity: 165 },
        { name: 'Backstage Lounge Access', price: 349, totalQuantity: 40, soldQuantity: 35 }
      ]
    },
    {
      title: 'Full-Stack React & Node.js Masterclass',
      description: 'A deep-dive, interactive workshop for engineers looking to master scalable React 19 architecture, micro-frontends, high-throughput Node.js APIs, and database concurrency optimization.',
      category: 'Workshops',
      venue: 'TechHub Innovation Arena',
      city: 'San Francisco',
      startDateTime: new Date(now.getTime() + 8 * day + 10 * 3600 * 1000),
      endDateTime: new Date(now.getTime() + 8 * day + 17 * 3600 * 1000),
      bannerImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
      organizer: organizerId,
      status: 'published',
      ticketTypes: [
        { name: 'Workshop Seat', price: 149, totalQuantity: 60, soldQuantity: 42 },
        { name: 'Workshop + 1-on-1 Code Review', price: 249, totalQuantity: 20, soldQuantity: 18 }
      ]
    },
    {
      title: 'Metropolitan Half Marathon & 10K Run',
      description: 'Lace up your running shoes for the premier city marathon! Scenic coastal route, hydration points every 2km, RFID timed bibs, official finisher medal, and post-race celebration village.',
      category: 'Sports',
      venue: 'Marine Promenade Starting Line',
      city: 'Mumbai',
      startDateTime: new Date(now.getTime() + 15 * day + 5 * 3600 * 1000),
      endDateTime: new Date(now.getTime() + 15 * day + 11 * 3600 * 1000),
      bannerImage: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80',
      organizer: organizerId,
      status: 'published',
      ticketTypes: [
        { name: '10K Fun Run Entry', price: 35, totalQuantity: 800, soldQuantity: 512 },
        { name: '21.1K Half Marathon Entry', price: 55, totalQuantity: 1200, soldQuantity: 930 },
        { name: 'Charity Runner Bib', price: 120, totalQuantity: 100, soldQuantity: 45 }
      ]
    },
    {
      title: 'Symphony Under the Stars: Classical Gala',
      description: 'Experience timeless masterpieces composed by Beethoven, Mozart, and Tchaikovsky performed live by the Metropolitan Philharmonic Orchestra in an acoustic outdoor amphitheater.',
      category: 'Music',
      venue: 'Central Park Botanical Amphitheatre',
      city: 'New York',
      startDateTime: new Date(now.getTime() + 7 * day + 19 * 3600 * 1000),
      endDateTime: new Date(now.getTime() + 7 * day + 22 * 3600 * 1000),
      bannerImage: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80',
      organizer: organizerId,
      status: 'published',
      ticketTypes: [
        { name: 'Lawn Seating', price: 40, totalQuantity: 500, soldQuantity: 310 },
        { name: 'Reserved Pavilion Tier', price: 85, totalQuantity: 350, soldQuantity: 290 },
        { name: 'Conductor Golden Circle', price: 160, totalQuantity: 80, soldQuantity: 74 }
      ]
    },
    {
      title: 'Startup Pitch & Venture Capital Demo Day',
      description: 'Connect with over 50 top angel investors, venture capitalists, and accelerators. Watch 15 high-growth early-stage startups pitch their game-changing products across SaaS, Biotech, and Clean Energy.',
      category: 'Business',
      venue: 'Marina Financial Center, Level 42',
      city: 'Singapore',
      startDateTime: new Date(now.getTime() + 18 * day + 14 * 3600 * 1000),
      endDateTime: new Date(now.getTime() + 18 * day + 20 * 3600 * 1000),
      bannerImage: 'https://images.unsplash.com/photo-1559223607-a43c990c692c?auto=format&fit=crop&w=1200&q=80',
      organizer: organizerId,
      status: 'published',
      ticketTypes: [
        { name: 'Founder Guest Ticket', price: 60, totalQuantity: 120, soldQuantity: 95 },
        { name: 'Investor & Partner Pass', price: 199, totalQuantity: 80, soldQuantity: 62 }
      ]
    },
    {
      title: 'Modern UI/UX Design Sprint & Figma Systems',
      description: 'A hands-on workshop guiding product designers from wireframing to production-ready design tokens, responsive auto-layout, micro-interactions, and accessibility standards.',
      category: 'Workshops',
      venue: 'DesignHub Studios, Loft 3',
      city: 'London',
      startDateTime: new Date(now.getTime() + 10 * day + 9 * 3600 * 1000),
      endDateTime: new Date(now.getTime() + 10 * day + 16 * 3600 * 1000),
      bannerImage: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80',
      organizer: organizerId,
      status: 'published',
      ticketTypes: [
        { name: 'Standard Seat', price: 120, totalQuantity: 40, soldQuantity: 31 },
        { name: 'Student Ticket', price: 60, totalQuantity: 15, soldQuantity: 15 }
      ]
    },
    {
      title: 'National Badminton Championship Finals',
      description: 'Witness the nation’s highest-ranked singles and doubles badminton athletes clash in an adrenaline-packed tournament finale with Olympic commentators and courtside seating.',
      category: 'Sports',
      venue: 'Indira Gandhi Indoor Stadium',
      city: 'Delhi',
      startDateTime: new Date(now.getTime() + 6 * day + 17 * 3600 * 1000),
      endDateTime: new Date(now.getTime() + 6 * day + 22 * 3600 * 1000),
      bannerImage: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80',
      organizer: organizerId,
      status: 'published',
      ticketTypes: [
        { name: 'Upper Tier Stand', price: 20, totalQuantity: 600, soldQuantity: 410 },
        { name: 'Lower Tier Court View', price: 45, totalQuantity: 300, soldQuantity: 280 },
        { name: 'Courtside VIP Box', price: 110, totalQuantity: 50, soldQuantity: 48 }
      ]
    },
    {
      title: 'Cloud Native & Kubernetes DevOps Expo',
      description: 'Explore the modern cloud landscape: Kubernetes scaling, service meshes, GitOps pipelines, infrastructure as code, and site reliability engineering at scale.',
      category: 'Technology',
      venue: 'Silicon Valley Convention Complex',
      city: 'San Francisco',
      startDateTime: new Date(now.getTime() + 22 * day + 9 * 3600 * 1000),
      endDateTime: new Date(now.getTime() + 23 * day + 18 * 3600 * 1000),
      bannerImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
      organizer: organizerId,
      status: 'published',
      ticketTypes: [
        { name: 'Expo Hall Access', price: 0, totalQuantity: 500, soldQuantity: 420 },
        { name: 'All-Access DevOps Pass', price: 299, totalQuantity: 250, soldQuantity: 110 }
      ]
    },
    {
      title: 'Artisan Coffee Brewing & Barista Masterclass',
      description: 'Discover the art of specialty coffee. Learn bean origin grading, roast profiles, pour-over extraction physics, espresso dial-in, and silky milk texturing with certified Q-graders.',
      category: 'Workshops',
      venue: 'The Roastery Academy, Indiranagar',
      city: 'Bengaluru',
      startDateTime: new Date(now.getTime() + 9 * day + 10 * 3600 * 1000),
      endDateTime: new Date(now.getTime() + 9 * day + 14 * 3600 * 1000),
      bannerImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
      organizer: organizerId,
      status: 'published',
      ticketTypes: [
        { name: 'Barista Experience', price: 65, totalQuantity: 25, soldQuantity: 19 }
      ]
    },
    {
      title: 'Midnight Jazz & Soul Sessions',
      description: 'An intimate, candlelit evening of live blues, soul ballads, and smooth modern jazz featuring legendary saxophonists and vocal trios accompanied by artisanal cocktails.',
      category: 'Music',
      venue: 'The Blue Note Cellar',
      city: 'London',
      startDateTime: new Date(now.getTime() + 4 * day + 21 * 3600 * 1000),
      endDateTime: new Date(now.getTime() + 5 * day + 1 * 3600 * 1000),
      bannerImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80',
      organizer: organizerId,
      status: 'published',
      ticketTypes: [
        { name: 'Standing Bar Area', price: 30, totalQuantity: 100, soldQuantity: 80 },
        { name: 'Table for Two (Includes Drinks)', price: 95, totalQuantity: 40, soldQuantity: 38 }
      ]
    },
    {
      title: 'Premier League Fan Fest & Giant Screen Viewing',
      description: 'The ultimate matchday atmosphere with 20-meter 4K LED screens, live DJ sets before kickoff, stadium sound systems, food trucks, and exclusive team merchandise giveaways.',
      category: 'Sports',
      venue: 'Jawaharlal Nehru Stadium Arena',
      city: 'Delhi',
      startDateTime: new Date(now.getTime() + 3 * day + 18 * 3600 * 1000),
      endDateTime: new Date(now.getTime() + 3 * day + 23 * 3600 * 1000),
      bannerImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
      organizer: organizerId,
      status: 'published',
      ticketTypes: [
        { name: 'Fan Pass', price: 15, totalQuantity: 1500, soldQuantity: 1120 },
        { name: 'VIP Seated Zone', price: 40, totalQuantity: 200, soldQuantity: 180 }
      ]
    },
    {
      title: 'CyberSecurity & Zero Trust Defense Conference',
      description: 'Essential cybersecurity briefings on threat hunting, ransomware defense, cryptographic identity verification, zero-trust cloud architectures, and red-team penetration testing demonstrations.',
      category: 'Technology',
      venue: 'ExCeL International Centre',
      city: 'London',
      startDateTime: new Date(now.getTime() + 25 * day + 8 * 3600 * 1000),
      endDateTime: new Date(now.getTime() + 26 * day + 17 * 3600 * 1000),
      bannerImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
      organizer: organizerId,
      status: 'published',
      ticketTypes: [
        { name: 'Professional Delegate', price: 220, totalQuantity: 300, soldQuantity: 140 },
        { name: 'Hands-on Red Team Workshop', price: 380, totalQuantity: 50, soldQuantity: 46 }
      ]
    },
    {
      title: 'Mindfulness, Yoga & Sound Bath Sanctuary',
      description: 'A transformative holistic retreat featuring restorative Vinyasa yoga sessions, guided Tibetan singing bowl sound healing, pranayama breathwork, and organic Ayurvedic nourishment.',
      category: 'Workshops',
      venue: 'Serenity Hills Eco Retreat',
      city: 'Bengaluru',
      startDateTime: new Date(now.getTime() + 11 * day + 7 * 3600 * 1000),
      endDateTime: new Date(now.getTime() + 11 * day + 16 * 3600 * 1000),
      bannerImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
      organizer: organizerId,
      status: 'published',
      ticketTypes: [
        { name: 'Day Retreat Pass', price: 75, totalQuantity: 50, soldQuantity: 39 }
      ]
    },
    {
      title: 'Broadway Musical Showcase: Starlight Dreams',
      description: 'A breathtaking live theatrical production featuring award-winning vocalists, a full live orchestra, mesmerizing stage choreography, and unforgettable timeless showtunes.',
      category: 'Arts & Theatre',
      venue: 'Royal Opera House',
      city: 'Mumbai',
      startDateTime: new Date(now.getTime() + 16 * day + 19 * 3600 * 1000),
      endDateTime: new Date(now.getTime() + 16 * day + 22 * 3600 * 1000),
      bannerImage: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
      organizer: organizerId,
      status: 'published',
      ticketTypes: [
        { name: 'Balcony Tier', price: 45, totalQuantity: 250, soldQuantity: 190 },
        { name: 'Stalls & Orchestra Rows', price: 95, totalQuantity: 300, soldQuantity: 280 },
        { name: 'Royal Private Box', price: 220, totalQuantity: 20, soldQuantity: 19 }
      ]
    },
    {
      title: 'E-Commerce Growth & D2C Brands Summit',
      description: 'Scale your online brand to 8-figures. Learn cutting-edge customer acquisition strategies, TikTok & Meta ad scaling, retention loops, and supply chain logistics from top founders.',
      category: 'Business',
      venue: 'Sands Expo & Convention Centre',
      city: 'Singapore',
      startDateTime: new Date(now.getTime() + 20 * day + 9 * 3600 * 1000),
      endDateTime: new Date(now.getTime() + 21 * day + 17 * 3600 * 1000),
      bannerImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
      organizer: organizerId,
      status: 'published',
      ticketTypes: [
        { name: 'General Delegate', price: 110, totalQuantity: 250, soldQuantity: 160 },
        { name: 'Founder Mastermind Dinner', price: 320, totalQuantity: 40, soldQuantity: 38 }
      ]
    }
  ];
};

module.exports = {
  getSeedEvents
};
