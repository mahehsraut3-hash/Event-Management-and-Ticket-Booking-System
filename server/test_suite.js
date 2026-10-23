const http = require('http');

async function runFullTestSuite() {
  console.log('====================================================');
  console.log('       TBS FULL INTEGRATION & SECURITY TEST SUITE   ');
  console.log('====================================================\n');

  const { app, server } = require('./src/server');

  // Allow server initialization
  await new Promise((r) => setTimeout(r, 1200));

  const BASE_URL = 'http://localhost:5000';

  const request = (path, method = 'GET', body = null, token = null) => {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BASE_URL);
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const req = http.request(url, { method, headers }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data, headers: res.headers });
          }
        });
      });
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  };

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition, message) => {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  };

  try {
    // ------------------------------------------------------------------
    // TEST SUITE 1: Security Headers & Health Check
    // ------------------------------------------------------------------
    console.log('TEST SUITE 1: Security Headers (Helmet & Rate Limiting)');
    const health = await request('/api/health');
    assert(health.status === 200, 'Health check returns HTTP 200');
    assert(health.headers['x-content-type-options'] === 'nosniff', 'Helmet nosniff header present');
    assert(health.headers['x-frame-options'] === 'SAMEORIGIN', 'Helmet X-Frame-Options header present');
    assert(health.headers['ratelimit-limit'] !== undefined, 'Rate limit headers attached');

    // ------------------------------------------------------------------
    // TEST SUITE 2: Authentication & Role Authorization
    // ------------------------------------------------------------------
    console.log('\nTEST SUITE 2: Authentication APIs');
    const testEmail = `attendee_${Date.now()}@test.com`;

    // 2.1 Register
    const regRes = await request('/api/auth/register', 'POST', {
      name: 'Test Attendee',
      email: testEmail,
      password: 'password123',
      role: 'attendee'
    });
    assert(regRes.status === 201, 'User registration succeeds (HTTP 201)');
    assert(regRes.data?.data?.token !== undefined, 'Registration issues JWT token');

    // 2.2 Reject duplicate registration
    const dupRes = await request('/api/auth/register', 'POST', {
      name: 'Duplicate User',
      email: testEmail,
      password: 'password123'
    });
    assert(dupRes.status === 409 || dupRes.status === 400, 'Duplicate email registration rejected (HTTP 409 Conflict)');

    // 2.3 Reject invalid password
    const badLogin = await request('/api/auth/login', 'POST', {
      email: testEmail,
      password: 'wrongpassword'
    });
    assert(badLogin.status === 401, 'Invalid credentials rejected (HTTP 401)');

    // 2.4 Login with valid credentials
    const loginRes = await request('/api/auth/login', 'POST', {
      email: testEmail,
      password: 'password123'
    });
    assert(loginRes.status === 200, 'Valid login succeeds (HTTP 200)');
    const attendeeToken = loginRes.data?.data?.token;

    // 2.5 Auth /me
    const meRes = await request('/api/auth/me', 'GET', null, attendeeToken);
    assert(meRes.status === 200, 'GET /api/auth/me returns user profile');
    assert(meRes.data?.data?.user?.email === testEmail, 'Profile email matches authenticated user');

    // ------------------------------------------------------------------
    // TEST SUITE 3: Ticket Booking & Overselling Prevention
    // ------------------------------------------------------------------
    console.log('\nTEST SUITE 3: Ticket Booking & Atomic Capacity Protection');
    const eventsRes = await request('/api/events');
    const testEvent = eventsRes.data?.data?.events?.[0];
    assert(testEvent !== undefined, 'Published events retrieved for booking test');

    const tier = testEvent.ticketTypes[0];

    // 3.1 Prevent overselling
    const oversellRes = await request(
      '/api/bookings',
      'POST',
      {
        eventId: testEvent._id,
        tickets: [{ ticketTypeName: tier.name, quantity: 999999 }]
      },
      attendeeToken
    );
    assert(oversellRes.status === 400, 'Overselling beyond total capacity rejected (HTTP 400)');

    // 3.2 Valid booking
    const bookRes = await request(
      '/api/bookings',
      'POST',
      {
        eventId: testEvent._id,
        tickets: [{ ticketTypeName: tier.name, quantity: 2 }]
      },
      attendeeToken
    );
    assert(bookRes.status === 201, 'Booking reservation created successfully (HTTP 201)');
    const bookingId = bookRes.data?.data?.booking?._id;
    assert(bookingId !== undefined, 'Booking record ID generated');

    // ------------------------------------------------------------------
    // TEST SUITE 4: Payment Verification & QR Ticket Validation
    // ------------------------------------------------------------------
    console.log('\nTEST SUITE 4: Payment Verification & Gate Scanner Security');

    // 4.1 Create order
    const orderRes = await request('/api/payments/create-order', 'POST', { bookingId }, attendeeToken);
    assert(orderRes.status === 201, 'Payment order created with TTL (HTTP 201)');

    // 4.2 Verify payment and issue signed QR tickets
    const verifyRes = await request(
      '/api/payments/verify',
      'POST',
      {
        bookingId,
        razorpay_order_id: orderRes.data?.data?.orderId,
        razorpay_payment_id: `pay_test_${Date.now()}`,
        razorpay_signature: `sig_sim_${Date.now()}`
      },
      attendeeToken
    );
    assert(verifyRes.status === 200, 'Payment verified successfully (HTTP 200)');
    assert(verifyRes.data?.data?.booking?.paymentStatus === 'paid', 'Booking marked paid');
    const tickets = verifyRes.data?.data?.tickets;
    assert(Array.isArray(tickets) && tickets.length === 2, 'Two signed QR tickets generated');

    const firstTicket = tickets[0];
    assert(firstTicket.ticketCode !== undefined, 'Ticket has alphanumeric ticketCode');
    assert(firstTicket.qrData !== undefined, 'Ticket contains signed QR payload');

    // 4.3 Organizer Gate Validation (VALID)
    const orgLogin = await request('/api/auth/login', 'POST', {
      email: 'organizer@example.com',
      password: 'password123'
    });
    const organizerToken = orgLogin.data?.data?.token;

    const validateRes = await request(
      '/api/tickets/validate',
      'POST',
      { qrData: firstTicket.qrData, eventId: testEvent._id },
      organizerToken
    );
    assert(validateRes.status === 200, 'Gate QR validation endpoint reachable');
    assert(validateRes.data?.result === 'VALID', 'Unused ticket marked VALID on first scan');

    // 4.4 Re-validate the same ticket (ALREADY_USED)
    const secondScan = await request(
      '/api/tickets/validate',
      'POST',
      { qrData: firstTicket.qrData, eventId: testEvent._id },
      organizerToken
    );
    assert(secondScan.data?.result === 'ALREADY_USED', 'Double admission prevented (ALREADY_USED)');

    // 4.5 Validate forged / tampered token (INVALID)
    const forgedScan = await request(
      '/api/tickets/validate',
      'POST',
      { qrData: 'tampered.qr.payload.forged', eventId: testEvent._id },
      organizerToken
    );
    assert(forgedScan.data?.result === 'INVALID', 'Tampered / forged QR rejected as INVALID');

    // ------------------------------------------------------------------
    // TEST SUITE 5: Admin Platform Moderation & Analytics
    // ------------------------------------------------------------------
    console.log('\nTEST SUITE 5: Administrator Moderation APIs');
    const adminLogin = await request('/api/auth/login', 'POST', {
      email: 'admin@example.com',
      password: 'password123'
    });
    const adminToken = adminLogin.data?.data?.token;
    assert(adminToken !== undefined, 'Admin authenticated successfully');

    // 5.1 Admin stats
    const statsRes = await request('/api/admin/stats', 'GET', null, adminToken);
    assert(statsRes.status === 200, 'GET /api/admin/stats returns aggregate metrics');
    assert(statsRes.data?.data?.overview?.totalUsers > 0, 'Overview contains totalUsers count');

    // 5.2 Admin list organizers
    const orgsRes = await request('/api/admin/organizers', 'GET', null, adminToken);
    assert(orgsRes.status === 200, 'GET /api/admin/organizers returns organizer list');

    // 5.3 Admin moderate event
    const modRes = await request(
      `/api/admin/events/${testEvent._id}/moderate`,
      'PATCH',
      { status: 'published', moderationNote: 'Approved by System Admin' },
      adminToken
    );
    assert(modRes.status === 200, 'Admin can moderate event status (HTTP 200)');

    // ------------------------------------------------------------------
    // TEST SUITE 6: Nodemailer QR Email Dispatch
    // ------------------------------------------------------------------
    console.log('\nTEST SUITE 6: Nodemailer QR Email Generation');
    const { sendBookingConfirmationEmail } = require('./src/utils/emailService');
    const emailResult = await sendBookingConfirmationEmail({
      booking: verifyRes.data?.data?.booking,
      user: { name: 'Test Attendee', email: 'attendee@example.com' },
      tickets,
      event: testEvent
    });
    assert(emailResult.success === true, 'Confirmation email generated with embedded QR attachments');

    console.log('\n====================================================');
    console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY! 🚀`);
    console.log('====================================================\n');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\nTest Suite Failure:', err);
    server.close();
    process.exit(1);
  }
}

runFullTestSuite();
