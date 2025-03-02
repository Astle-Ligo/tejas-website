var express = require('express');
var router = express.Router();

const eventHeadHelpers = require('../helpers/eventHead-helpers')


/* GET users listing. */
router.get('/', async (req, res) => {
    console.log("Event Head Dashboard Loaded");
    let eventHeadUser = req.session.eventHead;

    if (eventHeadUser) {
        try {
            res.render('eventHead/eventHead-dashboard', {
                eventHead: true,
                eventHeadUser,
            });
        } catch (error) {
            console.error("Error loading eventHead dashboard:", error);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.render('eventHead/eventHead-login', {
            eventHead: true,
            loginError: req.session.loginError || null
        });
        req.session.loginError = null; // Clear error after displaying
    }
});

// Route to render the login page
router.get('/eventHead-login', (req, res) => {
    res.render('eventHead/eventHead-login', {
        eventHead: true,
        loginError: req.session.loginError || null
    });
    req.session.loginError = null; // Clear error after displaying
});

// Route to handle login
router.post('/eventHead-login', async (req, res) => {
    console.log("Login attempt received");
    console.log(req.body);

    try {
        const response = await eventHeadHelpers.doLogin(req.body);
        console.log("Login status:", response.status);

        if (response.status) {
            req.session.eventHead = response.eventHead; // Save user session
            res.redirect('/eventHead');
        } else {
            req.session.loginError = "Invalid username or password";  // Fix error message key
            res.redirect('/eventHead-login');
        }
    } catch (error) {
        console.error("Error during eventHead login:", error);
        res.status(500).send("Error during eventHead login.");
    }
});

router.get("/registrations", async (req, res) => {
    try {
        let eventHeadUser = req.session.eventHead;
        let eventId = eventHeadUser.event;

        if (!eventHeadUser) {
            return res.redirect("/eventHead"); // Redirect to login if not authenticated
        }


        // Get registrations of the logged-in cultural representative
        const registrations = await eventHeadHelpers.getRegistrationsByEventId(eventId);
        const eventDetails = await eventHeadHelpers.getEventDetailsById(eventId);

        console.log(registrations,eventDetails);


        res.render("eventHead/registrations", {
            eventHead: true,
            eventHeadUser,
            eventDetails,  // Add event details to pass to the template
            registrations
        });
    } catch (error) {
        console.error("Error displaying registrations:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
