const db = require('../config/connection');
const collection = require('../config/collection');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

module.exports = {
    doLogin: (eventHeadData) => {
        return new Promise(async (resolve, reject) => {
            try {
                let response = {};
                let eventHead = await db.get().collection(collection.EVENT_HEAD_COLLECTION).findOne({ Email: eventHeadData.Email });

                if (eventHead) {
                    let status = await bcrypt.compare(eventHeadData.Password, eventHead.Password);
                    if (status) {
                        console.log("Login Success");
                        response.eventHead = eventHead;
                        response.status = true;
                        resolve(response);
                    } else {
                        console.log("Login Failed");
                        resolve({ status: false });
                    }
                } else {
                    console.log("No User Found");
                    resolve({ status: false });
                }
            } catch (error) {
                reject(error);
            }
        });
    },

    getRegistrationsByEventId: async (eventId) => {
        try {
            // Fetch registrations for the given eventId from the registration collection
            let registrations = await db.get()
                .collection(collection.REGISTRATION_COLLECTION)
                .find({ eventId: eventId })
                .toArray();

            return registrations;
        } catch (error) {
            console.error("Error fetching registrations:", error);
            throw new Error("Unable to fetch registrations.");
        }
    },

    getEventDetailsById: async (eventId) => {
        try {
            // Fetch event details for the given eventId from the event collection
            let eventDetails = await db.get()
                .collection(collection.EVENT_COLLECTION)
                .findOne({ _id: new ObjectId(eventId) });

            return eventDetails;
        } catch (error) {
            console.error("Error fetching event details:", error);
            throw new Error("Unable to fetch event details.");
        }
    },

    getRegistrationsByEventIds: async (eventIds) => {
        try {
            const registrations = await db.get()
                .collection(collection.REGISTRATION_COLLECTION)
                .find({ eventId: { $in: eventIds.map(id => id.toString()) } }) // Ensure string comparison
                .toArray();

            return registrations;
        } catch (error) {
            console.error("Error fetching registrations:", error);
            throw new Error("Unable to fetch registrations.");
        }
    },

    getEventDetailsByIds: async (eventIds) => {
        try {
            const events = await db.get()
                .collection(collection.EVENT_COLLECTION)
                .find({ _id: { $in: eventIds.map(id => new ObjectId(id)) } })
                .toArray();

            return events;
        } catch (error) {
            console.error("Error fetching event details:", error);
            throw new Error("Unable to fetch event details.");
        }
    },

    getEventsByHead: async (eventHeadId) => {
        try {
            // Fetch the event head details to get their assigned events
            let eventHead = await db.get()
                .collection(collection.EVENT_HEAD_COLLECTION)
                .findOne({ _id: new ObjectId(eventHeadId) });

            console.log("Event Head Data:", eventHead); // Debugging

            if (!eventHead) {
                console.error("Event head not found");
                return [];
            }

            // Ensure events is always an array
            let eventIds = Array.isArray(eventHead.events) ? eventHead.events : [eventHead.events];

            console.log("Normalized Event IDs:", eventIds); // Debugging

            // Convert event IDs to ObjectId format
            let eventObjectIds = eventIds.map(id => new ObjectId(id));

            // Fetch events from EVENT_COLLECTION
            let events = await db.get()
                .collection(collection.EVENT_COLLECTION)
                .find({ _id: { $in: eventObjectIds } })
                .toArray();

            console.log("Events found:", events); // Debugging
            return events;
        } catch (error) {
            console.error("Error fetching events for event head:", error);
            throw new Error("Unable to fetch events.");
        }
    },

    getRegistrationsByEventId: async (eventId) => {
        try {
            console.log("Fetching registrations for Event ID:", eventId);

            let registrations = await db.get()
                .collection(collection.REGISTRATION_COLLECTION)
                .find({ eventId: eventId.toString() }) // Ensure string comparison
                .toArray();

            console.log("Raw Registrations:", registrations);

            let participants = [];

            registrations.forEach(reg => {
                if (reg.type === "group" && reg.teamMembers && Array.isArray(reg.teamMembers)) {
                    // Extract members from group registrations
                    reg.teamMembers.forEach(member => {
                        participants.push({
                            _id: reg._id.toString(),  // Use the team's registration ID
                            name: member.name,
                            class: reg.classId  // Use the class from registration
                        });
                    });
                } else if (reg.type === "individual" && reg.participant) {
                    // Extract participant from individual registration
                    participants.push({
                        _id: reg._id.toString(),
                        name: reg.participant.name,
                        class: reg.classId
                    });
                }
            });

            console.log("Formatted Participants:", participants);

            return participants;
        } catch (error) {
            console.error("Error fetching registrations:", error);
            throw new Error("Unable to fetch registrations.");
        }
    },

    saveEventResults: async (resultData, eventHeadId) => {
        try {
            console.log("Event Head ID:", eventHeadId); // ✅ Debugging log

            const dbInstance = db.get();
            if (!dbInstance) throw new Error("Database connection is not initialized.");

            console.log("Raw resultData:", resultData); // ✅ Debugging log

            // Convert IDs to ObjectId only if they are valid
            const eventId = ObjectId.isValid(resultData.eventId) ? new ObjectId(resultData.eventId) : null;
            const firstPlace = ObjectId.isValid(resultData.firstPlace) ? new ObjectId(resultData.firstPlace) : null;
            const secondPlace = ObjectId.isValid(resultData.secondPlace) ? new ObjectId(resultData.secondPlace) : null;

            // ✅ Fix: Modify parameter instead of redeclaring
            eventHeadId = ObjectId.isValid(eventHeadId) ? new ObjectId(eventHeadId) : null;

            if (!eventId || !firstPlace || !secondPlace || !eventHeadId) {
                throw new Error("Invalid ObjectId provided.");
            }

            console.log("✅ All ObjectIds are valid:", { eventId, firstPlace, secondPlace, eventHeadId });

            // Fetch class details for first and second place winners
            const firstPlaceReg = await dbInstance.collection(collection.REGISTRATION_COLLECTION).findOne({ _id: firstPlace });
            const secondPlaceReg = await dbInstance.collection(collection.REGISTRATION_COLLECTION).findOne({ _id: secondPlace });

            console.log("First Place Registration:", firstPlaceReg);
            console.log("Second Place Registration:", secondPlaceReg);

            // Extract class names
            const classFirst = firstPlaceReg?.classId || "Unknown";
            const classSecond = secondPlaceReg?.classId || "Unknown";

            // Create event results object
            const eventResults = {
                eventId,
                eventHeadId, // ✅ Correct usage
                eventName: resultData.eventName.trim(),
                firstPlace,
                secondPlace,
                classFirst,
                classSecond,
                timestamp: new Date(),
            };

            console.log("Inserting into collection:", collection.RESULTS_COLLECTION);
            console.log("Data:", eventResults);

            // Insert into the database
            const insertedResult = await dbInstance.collection(collection.RESULTS_COLLECTION).insertOne(eventResults);

            return insertedResult;
        } catch (error) {
            console.error("Error saving event results:", error);
            throw error;
        }
    },

    getResultsByEventHead: async (eventHeadId) => {
        try {
            if (!ObjectId.isValid(eventHeadId)) {
                throw new Error("Invalid eventHeadId");
            }

            const results = await db.get().collection(collection.RESULTS_COLLECTION).aggregate([
                {
                    $match: { eventHeadId: new ObjectId(eventHeadId) }
                },
                {
                    $lookup: {
                        from: collection.REGISTRATION_COLLECTION,
                        localField: "firstPlace",
                        foreignField: "_id",
                        as: "firstWinner"
                    }
                },
                {
                    $lookup: {
                        from: collection.REGISTRATION_COLLECTION,
                        localField: "secondPlace",
                        foreignField: "_id",
                        as: "secondWinner"
                    }
                },
                {
                    $project: {
                        eventName: 1,
                        firstPlaceName: {
                            $cond: {
                                if: { $eq: [{ $arrayElemAt: ["$firstWinner.type", 0] }, "individual"] },
                                then: { $arrayElemAt: ["$firstWinner.participant.name", 0] },
                                else: { $arrayElemAt: ["$firstWinner.teamName", 0] }
                            }
                        },
                        classFirst: { $arrayElemAt: ["$firstWinner.classId", 0] },
                        secondPlaceName: {
                            $cond: {
                                if: { $eq: [{ $arrayElemAt: ["$secondWinner.type", 0] }, "individual"] },
                                then: { $arrayElemAt: ["$secondWinner.participant.name", 0] },
                                else: { $arrayElemAt: ["$secondWinner.teamName", 0] }
                            }
                        },
                        classSecond: { $arrayElemAt: ["$secondWinner.classId", 0] }
                    }
                }
            ]).toArray();

            console.log("Fetched Results for Event Head:", results);
            return results;
        } catch (error) {
            console.error("Error fetching results:", error);
            throw error;
        }
    }

}