var express = require('express');
var router = express.Router();
const adminHelpers = require('../helpers/admin-helpers');


function isAdminLoggedIn(req, res, next) {
  if (!req.session.admin) {
    return res.redirect('/admin/admin-login');
  }
  next();
}


/* GET Admin Dashboard */
router.get('/', async (req, res) => {
  console.log("Admin Dashboard Loaded");
  let adminUser = req.session.admin;

  if (!adminUser) {
    try {
      const adminCount = await adminHelpers.findAdminCount();
      return res.render('admin/no-user', { admin: true, count: adminCount.status > 0 });
    } catch (error) {
      console.error("Error checking admin count:", error);
      return res.status(500).send("Internal Server Error");
    }
  }

  try {

    res.render('admin/admin-dashboard', {
      admin: true,
      adminUser,
    });
  } catch (error) {
    console.error("Error loading admin dashboard:", error);
    res.status(500).send("Internal Server Error");
  }
});

/* Admin Signup */
router.get('/admin-signup', (req, res) => {
  res.render('admin/admin-signup', { admin: true });
});

router.post('/admin-signup', async (req, res) => {
  try {
    const adminData = await adminHelpers.doSignup(req.body);
    req.session.admin = adminData; // Store admin data in session
    res.redirect('/admin'); // Redirect to admin dashboard
  } catch (error) {
    console.error("Error signing up admin:", error);
    res.status(500).send("Error signing up admin.");
  }
});


/* Admin Login */
router.get('/admin-login', (req, res) => {
  console.log("hai");
  const errorMessage = req.session.errorMessage;
  req.session.errorMessage = null; // Clear error after displaying

  res.render('admin/admin-login', { admin: true, errorMessage });
});

router.post('/admin-login', async (req, res) => {
  try {
    const response = await adminHelpers.doLogin(req.body);

    if (response.status) {
      req.session.loggedIn = true;
      req.session.admin = response.admin;
      res.redirect('/admin');
    } else {
      req.session.errorMessage = "Invalid email or password"; // Store error in session
      res.redirect('/admin/admin-login'); // Redirect back to login page
    }
  } catch (error) {
    console.error("Error during admin login:", error);
    req.session.errorMessage = "An error occurred. Please try again.";
    res.redirect('/admin');
  }
});


/* Admin Logout */
router.get('/admin-log-out', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error logging out:", err);
      return res.status(500).send("Error logging out.");
    }
    res.redirect('/admin');
  });
});


/* Events Management */
router.get('/events', isAdminLoggedIn, async (req, res) => {
  try {

    let adminUser = req.session.admin;
    const events = await adminHelpers.getAllEvents();
    console.log(events);
    res.render('admin/events', { admin: true, adminUser, events });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).send("Error fetching events.");
  }
});

router.get('/add-event', isAdminLoggedIn, (req, res) => {
  res.render('admin/add-event', { admin: true, adminUser: req.session.admin });
});

router.post('/add-event', isAdminLoggedIn, async (req, res) => {
  try {
    await adminHelpers.addEvent(req.body);
    res.redirect('/admin/events');
  } catch (error) {
    console.error("Error adding event:", error);
    res.status(500).send("Error adding event.");
  }
});

router.get('/edit-event/:id', isAdminLoggedIn, async (req, res) => {
  try {
    let event = await adminHelpers.getEventDetails(req.params.id);
    res.render('admin/edit-event', { event, admin: true, adminUser: req.session.admin });
  } catch (error) {
    console.error("Error fetching event details:", error);
    res.status(500).send("Error fetching event details.");
  }
});

router.post('/edit-event/:id', isAdminLoggedIn, async (req, res) => {
  try {
    console.log(req.body);

    await adminHelpers.updateEvent(req.params.id, req.body);
    res.redirect('/admin/events');
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).send("Error updating event.");
  }
});

router.get('/delete-event/:id', isAdminLoggedIn, async (req, res) => {
  try {
    await adminHelpers.deleteEvent(req.params.id);
    res.redirect('/admin/events');
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).send("Error deleting event.");
  }
});

router.get('/events/:id', isAdminLoggedIn, async (req, res) => {
  let event = await adminHelpers.getEventDetails(req.params.id)
  console.log(event);
  res.render('admin/event-page', { event, admin: true, adminUser: req.session.admin })
})

router.get('/cultural-rep-signup', (req, res) => {
  res.render('admin/cultural-rep-signup', { admin: true });
});

router.post('/cultural-rep-signup', async (req, res) => {
  try {
    await adminHelpers.doCulturalRepSignup(req.body);
    res.redirect('/admin');
  } catch (error) {
    console.error("Error signing up admin:", error);
    res.status(500).send("Error signing up admin.");
  }
});

router.get('/event-head-signup', async (req, res) => {
  try {
    // Call the helper function to get the events
    const events = await adminHelpers.getAllEvents();

    // Render the 'event-head-signup' page and pass both the admin flag and the events
    res.render('admin/event-head-signup', {
      admin: true,
      events: events  // Pass the events to the template
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).send("Unable to fetch events.");
  }
});


router.post('/event-head-signup', async (req, res) => {
  try {
    // Handle signup logic and save event head to database
    await adminHelpers.doEventHeadSignup(req.body);
    res.redirect('/admin'); // Redirect to admin page after successful signup
  } catch (error) {
    console.error("Error signing up event head:", error);
    res.status(500).send("Error signing up event head.");
  }
});



router.get('/cultural-reps', isAdminLoggedIn, async (req, res) => {
  let cultural_reps = await adminHelpers.getAllCulturalReps()
  console.log(cultural_reps);
  res.render('admin/cultural-reps', { cultural_reps, admin: true, adminUser: req.session.admin })
})

router.get("/classRegistrations", isAdminLoggedIn, async (req, res) => {
  try {
    const classes = await adminHelpers.getAllClasses();
    res.render("admin/classwise-registration", {
      admin: true,
      adminUser: req.session.admin,
      classes,
    });
  } catch (error) {
    console.error("❌ Error fetching classes:", error);
    res.status(500).send("Error fetching class registrations.");
  }
});

// Get registrations for a specific class
router.get('/classRegistrations/:classId', isAdminLoggedIn, async (req, res) => {
  try {
    const classId = req.params.classId;
    const registrations = await adminHelpers.getRegistrationsForClass(classId);

    console.log(registrations);


    // Render the class registrations page and pass the registrations data
    res.render('admin/class-participants', {
      classId,
      registrations, admin: true,
      adminUser: req.session.admin,
    });
  } catch (error) {
    console.error("Error fetching class registrations:", error);
    res.status(500).send("Unable to fetch registrations for the class");
  }
});

// Route to display all events for admin
router.get("/eventRegistrations", isAdminLoggedIn, async (req, res) => {
  try {
    const events = await adminHelpers.getAllEvents();
    res.render("admin/event-registration", {
      admin: true,
      adminUser: req.session.admin,
      events,
    });
  } catch (error) {
    console.error("❌ Error fetching events:", error);
    res.status(500).send("Error fetching event registrations.");
  }
});

// Route to display registrations for a specific event
router.get('/eventRegistrations/:eventId', isAdminLoggedIn, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const registrations = await adminHelpers.getRegistrationsForEvent(eventId);
    const eventDetails = await adminHelpers.getEventDetailsById(eventId);
    console.log(registrations);

    // Render the event registrations page and pass the event details and registrations data
    res.render('admin/event-participants', {
      eventDetails,
      registrations,
      admin: true,
      adminUser: req.session.admin,
    });
  } catch (error) {
    console.error("Error fetching event registrations:", error);
    res.status(500).send("Unable to fetch registrations for the event.");
  }
});

router.get('/event-heads', isAdminLoggedIn, async (req, res) => {
  try {
    let eventHeads = await adminHelpers.getAllEventHeads();
    console.log(eventHeads[0]);

    res.render('admin/event-heads', {
      eventHeads,
      admin: true,
      adminUser: req.session.admin,
    });
  } catch (error) {
    console.error('Error fetching event heads:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/delete-eventHead/:id', isAdminLoggedIn, async (req, res) => {
  try {
    const eventHeadId = req.params.id;
    await adminHelpers.deleteEventHead(eventHeadId);
    res.redirect('/admin/event-heads'); // Redirect back to the event heads list
  } catch (error) {
    console.error("Error deleting event head:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get('/delete-culRep/:id', isAdminLoggedIn, async (req, res) => {
  try {
    const culRepId = req.params.id;
    await adminHelpers.deleteCulRep(culRepId);
    res.redirect('/admin/cultural-reps'); // Redirect back to the event heads list
  } catch (error) {
    console.error("Error deleting event head:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get('/classResults', isAdminLoggedIn, async (req, res) => {
  try {
    let classes = await adminHelpers.getAllClasses();
    res.render('admin/classResults', {
      classes,
      admin: true,
      adminUser: req.session.admin,
    });
  } catch (error) {
    console.error('Error fetching class results:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/classResults/:classId', isAdminLoggedIn, async (req, res) => {
  try {
    let classId = req.params.classId;

    // Fetch results and registrations
    let resultsData = await adminHelpers.getResultsByClass(classId);
    let registrations = await adminHelpers.getRegistrationsByClass(classId);

    let processedResults = [];
    let totalPoints = 0; // Declare total points
    let firstPlaceCount = 0;
    let secondPlaceCount = 0;
    let thirdPlaceCount = 0;

    resultsData.forEach(event => {
      let resultsArray = Array.isArray(event.results) ? event.results : [event.results];

      resultsArray.forEach(result => {
        console.log("Processing result:", JSON.stringify(result, null, 2));

        if (String(result.classId) === String(classId)) {
          let exists = processedResults.some(
            (r) => r.eventName === event.eventName && r.teamOrParticipant === result.teamName
          );

          if (!exists) {
            let processedResult = {
              eventName: event.eventName,
              position: result.position || 'N/A',
              points: result.points || 0,
              type: result.type,
            };

            if (result.type === 'group') {
              processedResult.eventType = "group";
              processedResult.contact = result.contact?.teamPhone || 'N/A';
              processedResult.teamOrParticipant = result.teamName || 'Unknown Team';
              processedResult.teamMembers = result.teamMembers || [];
            } else if (result.type === 'individual') {
              processedResult.eventType = "individual";
              processedResult.contact = result.participant?.phone || 'N/A';
              processedResult.teamOrParticipant = result.participant?.name || 'Unknown Participant';
              processedResult.regNum = result.participant?.regNum || 'N/A';
            }

            // Count positions
            if (result.position === "First") firstPlaceCount++;
            if (result.position === "Second") secondPlaceCount++;
            if (result.position === "Third") thirdPlaceCount++;

            totalPoints += parseInt(result.points) || 0;
            processedResults.push(processedResult);
          }
        }
      });
    });

    console.log(processedResults);


    // Render the page with results
    res.render('admin/classDetails', {
      results: processedResults,
      classId,
      totalPoints,
      firstPlaceCount,
      secondPlaceCount,
      thirdPlaceCount,
      admin: true,
      adminUser: req.session.admin,
    });

  } catch (error) {
    console.error('Error fetching results for class:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/eventResults', isAdminLoggedIn, async (req, res) => {
  try {
    const events = await adminHelpers.getAllEvents();
    res.render("admin/eventwise-result", {
      admin: true,
      adminUser: req.session.admin,
      events,
    });
  } catch (error) {
    console.error("❌ Error fetching events:", error);
    res.status(500).send("Error fetching event registrations.");
  }
})

router.get('/eventResults/:eventId', isAdminLoggedIn, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const eventResults = await adminHelpers.getResultsByEvent(eventId);
    console.log(eventId, eventResults);

    if (!eventResults) {
      return res.render("admin/event-Result", { eventResults: null });
    }

    res.render("admin/event-Result", {
      eventResults,
      admin: true,
      adminUser: req.session.admin,
    });
  } catch (error) {
    console.error("Error fetching event results:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/leaderboard", async (req, res) => {
  try {
    const leaderboardData = await adminHelpers.getLeaderboard();

    res.render("admin/leaderboard", {
      title: "Leaderboard",
      leaderboardData,
      admin: true,
      adminUser: req.session.admin,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/results", async (req, res) => {
  try {
    const results = await adminHelpers.getAllResults();
    console.log(results);

    res.render("admin/results", {
      results,
      admin: true,
      adminUser: req.session.admin,
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    res.status(500).send("Error fetching results");
  }
});

module.exports = router;
