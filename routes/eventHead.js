var express = require('express');
var router = express.Router();
const { ObjectId } = require('mongodb');

const eventHeadHelpers = require('../helpers/eventHead-helpers')


/* GET users listing. */
router.get('/', async (req, res) => {
    console.log("Event Head Dashboard Loaded");
    let eventHeadUser = req.session.eventHead;

    if (!eventHeadUser) {
        return res.render('eventHead/eventHead-login', {
            eventHead: true,
            loginError: req.session.loginError || null
        });
    }

    try {
        // Get all events managed by the event head
        let eventIds = eventHeadUser.events || []; // Ensure it exists

        if (!Array.isArray(eventIds)) {
            eventIds = [eventIds]; // Convert single ID to array
        }

        const events = await eventHeadHelpers.getEventDetailsByIds(eventIds);

        res.render('eventHead/eventHead-dashboard', {
            eventHead: true,
            eventHeadUser,
            events // Pass events to the template
        });
    } catch (error) {
        console.error("Error loading eventHead dashboard:", error);
        res.status(500).send("Internal Server Error");
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

router.get('/eventHead-log-out', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error logging out:", err);
            return res.status(500).send("Error logging out.");
        }
        res.redirect('/eventHead');
    });
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

router.get("/registrations/:eventId", async (req, res) => {
    try {
        let eventHeadUser = req.session.eventHead;

        if (!eventHeadUser) {
            return res.redirect("/eventHead"); // Redirect to login if not authenticated
        }

        let eventId = req.params.eventId; // Get eventId from URL

        if (!eventId) {
            return res.status(400).send("Event ID is required");
        }

        // Ensure the event belongs to the logged-in event head
        let eventIds = eventHeadUser.events || [];
        if (!Array.isArray(eventIds)) eventIds = [eventIds]; // Convert single eventId to array

        if (!eventIds.includes(eventId)) {
            return res.status(403).send("Unauthorized to access this event.");
        }

        console.log("Event Head User:", eventHeadUser);
        console.log("Selected Event ID:", eventId);

        // Fetch registrations for the specific event
        const registrations = await eventHeadHelpers.getRegistrationsByEventId(eventId);
        const eventDetails = await eventHeadHelpers.getEventDetailsById(eventId);

        console.log("Registrations:", registrations);
        console.log("Event Details:", eventDetails);

        res.render("eventHead/registrations", {
            eventHead: true,
            eventHeadUser,
            eventDetails,
            registrations
        });
    } catch (error) {
        console.error("Error displaying registrations:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/results", async (req, res) => {
    try {
        let eventHeadUser = req.session.eventHead;
        if (!eventHeadUser) return res.redirect("/eventHead");

        // Fetch events managed by the event head
        console.log(eventHeadUser);
        let events = await eventHeadHelpers.getEventsByHead(eventHeadUser._id);

        res.render("eventHead/results", {
            eventHead: true,
            eventHeadUser,
            events
        });
    } catch (error) {
        console.error("Error loading results entry page:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/results", async (req, res) => {
    console.log("response : :: ", req.body);

    const { eventId, eventName, firstPlace, secondPlace } = req.body;

    console.log("Received Data:", req.body); // Debugging log

    // Validate required fields
    if (!eventId || !firstPlace || !secondPlace) {
        return res.status(400).json({ error: "Missing required fields: eventId, firstPlace, or secondPlace" });
    }

    if (!eventName || typeof eventName !== "string" || eventName.trim() === "") {
        return res.status(400).json({ error: "Invalid eventName: It must be a non-empty string." });
    }

    try {
        console.log("dfdfdf ",req.session.eventHead);
        
        const response = await eventHeadHelpers.saveEventResults(req.body,req.session.eventHead._id);
        res.status(200).redirect('results');
    } catch (error) {
        console.error("Error submitting results:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


router.get("/getParticipants/:eventId", async (req, res) => {
    try {
        let eventId = req.params.eventId;
        console.log("Received eventId:", eventId);

        if (!eventId) return res.status(400).json({ error: "Event ID is required" });

        const participants = await eventHeadHelpers.getRegistrationsByEventId(eventId);

        console.log("Sending Participants:", participants);

        res.json(participants);
    } catch (error) {
        console.error("Error fetching participants:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/view-results", async (req, res) => {
    try {
        console.log(req.session);

        const eventHeadId = req.session.eventHead._id; // Get event head's ID from session
        const results = await eventHeadHelpers.getResultsByEventHead(eventHeadId);
        console.log(results);

        res.render("eventHead/view-results", {
            results, eventHead: true,
            eventHeadUser: req.session.eventHead,
        });
    } catch (error) {
        console.error("Error fetching results:", error);
        res.status(500).send("Internal Server Error");
    }
});


module.exports = router;
