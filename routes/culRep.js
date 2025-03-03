var express = require('express');
var router = express.Router();

const culRepHelpers = require('../helpers/culRep-helpers')


/* GET users listing. */
router.get('/', async (req, res) => {
  console.log("Cultural Dashboard Loaded");
  let culRepUser = req.session.culRep;

  if (culRepUser) {
    try {
      res.render('culRep/culRep-dashboard', {
        culRep: true,
        culRepUser,
      });
    } catch (error) {
      console.error("Error loading culRep dashboard:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.render('culRep/culRep-login', {
      culRep: true,
      loginError: req.session.loginError || null
    });
    req.session.loginError = null; // Clear error after displaying
  }
});

// Route to render the login page
router.get('/culRep-login', (req, res) => {
  res.render('culRep/culRep-login', {
    culRep: true,
    loginError: req.session.loginError || null
  });
  req.session.loginError = null; // Clear error after displaying
});

// Route to handle login
router.post('/culRep-login', async (req, res) => {
  console.log("Login attempt received");
  console.log(req.body);

  try {
    const response = await culRepHelpers.doLogin(req.body);
    console.log("Login status:", response.status);

    if (response.status) {
      req.session.culRep = response.culRep; // Save user session
      res.redirect('/culRep');
    } else {
      req.session.loginError = "Invalid username or password";  // Fix error message key
      res.redirect('/culRep-login');
    }
  } catch (error) {
    console.error("Error during culRep login:", error);
    res.status(500).send("Error during culRep login.");
  }
});

router.get('/cultural_rep-log-out', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error logging out:", err);
      return res.status(500).send("Error logging out.");
    }
    res.redirect('/culRep');
  });
});

router.get('/events', async (req, res) => {
  try {

    let culRepUser = req.session.culRep;
    const events = await culRepHelpers.getAllEvents();
    console.log(events);
    res.render('culRep/events', { culRep: true, culRepUser, events });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).send("Error fetching events.");
  }
});

router.get('/events/:id', async (req, res) => {
  try {
    // Get event details
    let event = await culRepHelpers.getEventDetails(req.params.id);
    console.log(event);
    console.log(req.session.culRep.class);

    // Get the current class registrations for the event
    const classRegistrationsCount = await culRepHelpers.getClassRegistrations(event._id, req.session.culRep.class);

    console.log(classRegistrationsCount);

    // Check if registration is allowed based on classReg value
    let canRegister = true;  // Default: allow registration
    if (event.classReg === "1" && classRegistrationsCount >= 1) {
      canRegister = false;  // Only one registration allowed per class
    } else if (event.classReg === "2" && classRegistrationsCount >= 2) {
      canRegister = false;  // Only two registrations allowed per class
    } else if (event.classReg === "unlimited" && classRegistrationsCount >= 1) {
      canRegister = true;  // Unlimited registrations are allowed
    }

    console.log(canRegister);


    res.render('culRep/event-page', {
      event,
      canRegister,  // Pass the canRegister flag to the view
      culRep: true,
      culRepUser: req.session.culRep
    });
  } catch (error) {
    console.error("Error displaying event:", error);
    res.status(500).send("Internal Server Error");
  }
});


router.get('/register-event/:id', async (req, res) => {
  let event = await culRepHelpers.getEventDetails(req.params.id)
  console.log(event);
  res.render('culRep/register-event-form', { event, culRep: true, culRepUser: req.session.culRep })
})

router.post('/register-event/:eventId', async (req, res) => {
  try {
    console.log(req.body);

    const eventId = req.params.eventId;
    const result = await culRepHelpers.registerEvent(eventId, req.body, req.session.culRep);

    if (!result.status) {
      return res.status(400).send(result.message);
    }

    res.redirect(`/culRep/events/${eventId}`);
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).send("Error processing registration.");
  }
});

router.get("/registrations", async (req, res) => {
  try {
    let culRepUser = req.session.culRep;

    if (!culRepUser) {
      return res.redirect("/culRep"); // Redirect to login if not authenticated
    }

    // Get registrations of the logged-in cultural representative
    const registrations = await culRepHelpers.getRegistrationsByCulturalRep(culRepUser._id);
    res.render("culRep/registrations", {
      culRep: true,
      culRepUser,
      registrations
    });
  } catch (error) {
    console.error("Error displaying registrations:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get('/edit-registration/:id', async (req, res) => {
  try {
    let registration = await culRepHelpers.getRegistrationDetails(req.params.id);

    if (!registration) {
      return res.status(404).send("Registration not found.");
    }

    let event = await culRepHelpers.getEventDetails(registration.eventId);
    console.log("Event data:", event, "Registration:", registration);

    res.render('culRep/edit-registration', { event, registration, culRep: true, culRepUser: req.session.culRep });
  } catch (error) {
    console.error("Error fetching event details:", error);
    res.status(500).send("Error fetching event details.");
  }
});

// 🔹 POST route to update registration details
router.post('/edit-registration/:id', async (req, res) => {
  console.log("hai");

  try {
    console.log("Updating registration...");

    const updateResponse = await culRepHelpers.updateRegistration(req.params.id, req.body, req.session.culRep);

    if (!updateResponse.status) {
      return res.status(400).send(updateResponse.message);
    }

    res.redirect('/culRep/registrations');
  } catch (error) {
    console.error("Error updating registration:", error);
    res.status(500).send("Error updating registration.");
  }
});


router.get('/delete-registration/:regId', async (req, res) => {
  try {
    const userId = req.session.culRep?._id; // Ensure userId is extracted properly

    if (!userId) {
      return res.status(401).send("Unauthorized: User not logged in.");
    }
    console.log(req.params.regId, userId);

    const response = await culRepHelpers.deleteRegistration(req.params.regId, userId);

    if (response.status) {
      res.redirect('/culRep/registrations');
    } else {
      res.status(404).send(response.message);
    }
  } catch (error) {
    console.error("Error deleting registration:", error);
    res.status(500).send("Error deleting registration.");
  }
});







module.exports = router;
