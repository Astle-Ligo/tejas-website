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
                let event = await db.get().collection(collection.EVENT_COLLECTION).findOne({ _id: new ObjectId(eventId) });
                resolve(event);
            } catch (error) {
                reject(error);
            }
        });
    },

    updateEvent: (eventId, eventDetails) => {
        return new Promise(async (resolve, reject) => {
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
                            eventHead: eventDetails.eventHead,
                            eventHeadContact: eventDetails.eventHeadContact,
                            eventDate: eventDetails.eventDate
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

};
