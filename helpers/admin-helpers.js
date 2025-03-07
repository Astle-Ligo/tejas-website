var db = require('../config/connection');
var collection = require('../config/collection');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

module.exports = {
    doSignup: (adminData) => {
        return new Promise(async (resolve, reject) => {
            try {
                adminData.Password = await bcrypt.hash(adminData.Password, 10);
                let data = await db.get().collection(collection.ADMIN_COLLECTION).insertOne(adminData);
                adminData._id = data.insertedId;
                resolve(adminData);
            } catch (error) {
                reject(error);
            }
        });
    },

    doLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            try {
                let response = {};
                let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ Email: adminData.Email });

                if (admin) {
                    let status = await bcrypt.compare(adminData.Password, admin.Password);
                    if (status) {
                        console.log("Login Success");
                        response.admin = admin;
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

    findAdminCount: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let count = await db.get().collection(collection.ADMIN_COLLECTION).countDocuments();
                resolve({ status: count > 0 });
            } catch (error) {
                reject(error);
            }
        });
    },

    addEvent: (event, callback) => {
        db.get().collection(collection.EVENT_COLLECTION).insertOne(event)
            .then((data) => callback(data.insertedId.toString()))
            .catch((error) => console.error("Error adding event:", error));
    },

    getAllEvents: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let events = await db.get().collection(collection.EVENT_COLLECTION).find().toArray();
                resolve(events);
            } catch (error) {
                reject(error);
            }
        });
    },

    getEventDetails: (eventId) => {
        return new Promise(async (resolve, reject) => {
            try {
                console.log("Received eventId:", eventId); // Debugging

                // Validate eventId
                if (!eventId || typeof eventId !== 'string' || eventId.length !== 24) {
                    return reject(new Error("Invalid event ID format"));
                }

                let event = await db.get().collection(collection.EVENT_COLLECTION)
                    .findOne({ _id: new ObjectId(eventId) });

                if (!event) {
                    return reject(new Error("Event not found"));
                }

                resolve(event);
            } catch (error) {
                console.error("Error in getEventDetails:", error);
                reject(error);
            }
        });
    },

    updateEvent: (eventId, eventDetails) => {
        return new Promise(async (resolve, reject) => {
            console.log(eventDetails.formattedDate);

            try {
                await db.get().collection(collection.EVENT_COLLECTION).updateOne(
                    { _id: new ObjectId(eventId) },
                    {
                        $set: {
                            eventName: eventDetails.eventName,
                            eventSubName: eventDetails.eventSubName,
                            eventImageUrl: eventDetails.eventImageUrl,
                            description: eventDetails.description,
                            eventStrength: eventDetails.eventStrength,
                            minParticipants: eventDetails.minParticipants,
                            maxParticipants: eventDetails.maxParticipants,
                            classReg: eventDetails.classReg,
                            timeLimit: eventDetails.timeLimit,
                            venue: eventDetails.venue,
                            eventTimeRaw: eventDetails.eventTimeRaw,
                            eventTime: eventDetails.eventTime,
                            eventHead: eventDetails.eventHead,
                            eventHeadContact: eventDetails.eventHeadContact,
                            eventDate: eventDetails.eventDate,
                            formattedDate: eventDetails.formattedDate
                        }
                    }
                );
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    },

    deleteEvent: (eventId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let response = await db.get().collection(collection.EVENT_COLLECTION).deleteOne({ _id: new ObjectId(eventId) });
                resolve(response);
            } catch (error) {
                reject(error);
            }
        });
    },

    doCulturalRepSignup: (adminData) => {
        return new Promise(async (resolve, reject) => {
            try {
                adminData.Password = await bcrypt.hash(adminData.Password, 10);
                let data = await db.get().collection(collection.CULTURAL_REP_COLLECTION).insertOne(adminData);
                adminData._id = data.insertedId;
                resolve(adminData);
            } catch (error) {
                reject(error);
            }
        });
    },

    doEventHeadSignup: (adminData) => {
        return new Promise(async (resolve, reject) => {
            try {
                adminData.Password = await bcrypt.hash(adminData.Password, 10);
                let data = await db.get().collection(collection.EVENT_HEAD_COLLECTION).insertOne(adminData);
                adminData._id = data.insertedId;
                resolve(adminData);
            } catch (error) {
                reject(error);
            }
        });
    },

    getAllCulturalReps: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let cultural_reps = await db.get().collection(collection.CULTURAL_REP_COLLECTION).find().toArray();
                resolve(cultural_reps);
            } catch (error) {
                reject(error);
            }
        });
    },

    // ✅ Fixed getAllClasses function
    getAllClasses: async () => {
        try {
            return await db.get().collection(collection.REGISTRATION_COLLECTION).distinct("classId");
        } catch (error) {
            console.error("❌ Error fetching classes:", error);
            return [];
        }
    },

    // ✅ Fixed getParticipantsByClass function
    getParticipantsByClass: async (classId) => {
        try {
            let registrations = await db.get()
                .collection(collection.REGISTRATION_COLLECTION)
                .find({ classId: classId })
                .toArray();

            let participants = [];

            registrations.forEach(reg => {
                if (reg.type === "individual") {
                    participants.push({
                        name: reg.participant.name,
                        regNum: reg.participant.regNum,
                        email: reg.participant.email,
                        phone: reg.participant.phone,
                        type: "Individual"
                    });
                } else if (reg.type === "group") {
                    reg.teamMembers.forEach(member => {
                        participants.push({
                            name: member.name,
                            regNum: member.regNum,
                            teamName: reg.teamName,
                            contact: reg.contact.teamNumber,
                            type: "Group"
                        });
                    });
                }
            });

            return participants;
        } catch (error) {
            console.error("❌ Error fetching participants:", error);
            return [];
        }
    },

    getRegistrationsForClass: async (classId) => {
        try {
            // Fetch all registrations for the specified class
            let registrations = await db.get()
                .collection(collection.REGISTRATION_COLLECTION)
                .find({ classId: classId })
                .toArray();

            // Fetch event details for each registration
            const eventIds = [...new Set(registrations.map(reg => new ObjectId(reg.eventId)))];
            let events = await db.get()
                .collection(collection.EVENT_COLLECTION)
                .find({ _id: { $in: eventIds } })
                .toArray();

            // Create a map for events by eventId
            const eventMap = events.reduce((map, event) => {
                map[event._id.toString()] = event;
                return map;
            }, {});

            // Attach event details to each registration
            registrations.forEach(reg => {
                reg.eventDetails = eventMap[reg.eventId] || { eventName: "Unknown Event", eventDate: "Unknown Date" };
            });

            return registrations;
        } catch (error) {
            console.error("Error fetching class registrations:", error);
            return [];
        }
    },

    getRegistrationsForEvent: async (eventId) => {
        try {
            // Query eventId as a string
            let registrations = await db.get()
                .collection(collection.REGISTRATION_COLLECTION)
                .find({ eventId: eventId }) // eventId is a string here
                .toArray();

            console.log(registrations);


            // Fetch event details for the provided eventId
            const eventDetails = await db.get()
                .collection(collection.EVENT_COLLECTION)
                .findOne({ _id: new ObjectId(eventId) });  // Instantiate ObjectId correctly

            console.log(eventDetails);


            // Iterate over each registration and add event details
            registrations.forEach(reg => {
                reg.eventDetails = eventDetails;

                // Convert the eventId to a string
                reg.eventId = reg.eventId.toString();

                // Format the timestamp to a human-readable format
                reg.timestampFormatted = new Date(reg.timestamp).toLocaleString(); // Customize format as needed
            });

            return registrations;
        } catch (error) {
            console.error("❌ Error fetching registrations:", error);
            return [];
        }
    },


    getEventDetailsById: async (eventId) => {
        try {
            let event = await db.get().collection(collection.EVENT_COLLECTION).findOne({ _id: new ObjectId(eventId) });
            return event;
        } catch (error) {
            console.error("Error fetching event details:", error);
            throw error;
        }
    },

    getAllEventHeads: async () => {
        try {
            const eventHeads = await db.get()
                .collection(collection.EVENT_HEAD_COLLECTION)
                .find({})
                .toArray();

            // Process each event head
            await Promise.all(eventHeads.map(async (eventHead) => {
                if (!eventHead.events) {
                    eventHead.eventDetails = [{ name: "No Events Assigned", date: "N/A" }];
                    return;
                }

                const eventIds = Array.isArray(eventHead.events)
                    ? eventHead.events.map(id => new ObjectId(id))
                    : [new ObjectId(eventHead.events)];

                // Fetch event details
                const events = await db.get()
                    .collection(collection.EVENT_COLLECTION)
                    .find({ _id: { $in: eventIds } })
                    .toArray();

                eventHead.eventDetails = events.length > 0
                    ? events.map(event => ({
                        name: event.eventName || "Unnamed Event",
                        subName:event.eventSubName,
                        date: event.eventDate || "No Date"
                    }))
                    : [{ name: "Event Not Found", date: "N/A" }];
            }));

            return eventHeads;
        } catch (error) {
            console.error("Error fetching event heads:", error);
            throw error;
        }
    },

    deleteEventHead: async (eventHeadId) => {
        try {
            await db.get()
                .collection(collection.EVENT_HEAD_COLLECTION)
                .deleteOne({ _id: new ObjectId(eventHeadId) });

            console.log(`Event head with ID ${eventHeadId} deleted successfully`);
        } catch (error) {
            console.error("Error deleting event head:", error);
            throw error;
        }
    },

    deleteCulRep: async (culRepId) => {
        try {
            await db.get()
                .collection(collection.CULTURAL_REP_COLLECTION)
                .deleteOne({ _id: new ObjectId(culRepId) });

            console.log(`Event head with ID ${culRepId} deleted successfully`);
        } catch (error) {
            console.error("Error deleting event head:", error);
            throw error;
        }
    },

    getResultsByClass: async (classId) => {
        try {
            let results = await db.get().collection(collection.RESULTS_COLLECTION).find({ classId }).toArray();

            for (let result of results) {
                let event = await db.get().collection(collection.EVENT_HEAD_COLLECTION).findOne({ _id: result.eventId });
                result.eventName = event ? event.name : 'Unknown Event';

                // Assign points based on position
                result.points = result.position === "First" ? 10 : result.position === "Second" ? 5 : 0;
            }

            return results;
        } catch (error) {
            console.error('Error fetching results:', error);
            throw error;
        }
    },

    getRegistrationsByClass: async (classId) => {
        try {
            let registrations = await db
                .get()
                .collection(collection.REGISTRATION_COLLECTION)
                .find({ classId: classId })
                .toArray();

            return registrations;
        } catch (error) {
            console.error('Error fetching registrations:', error);
            throw error;
        }
    }

};
