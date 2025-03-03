const db = require('../config/connection');
const collection = require('../config/collection');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

module.exports = {
    doLogin: (culRepData) => {
        return new Promise(async (resolve, reject) => {
            try {
                let response = {};
                let culRep = await db.get().collection(collection.CULTURAL_REP_COLLECTION).findOne({ Email: culRepData.Email });

                if (culRep) {
                    let status = await bcrypt.compare(culRepData.Password, culRep.Password);
                    if (status) {
                        console.log("Login Success");
                        response.culRep = culRep;
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

                if (!ObjectId.isValid(eventId)) {
                    console.log("Invalid ObjectId format");
                    return resolve(null);
                }

                let event = await db.get().collection(collection.EVENT_COLLECTION).findOne({ _id: new ObjectId(eventId) });

                resolve(event);
            } catch (error) {
                console.error("Error in getEventDetails:", error);
                reject(error);
            }
        });
    },

    getRegistrationDetails: (regId) => {
        return new Promise(async (resolve, reject) => {
            try {

                if (!ObjectId.isValid(regId)) {
                    console.log("Invalid ObjectId format");
                    return resolve(null);
                }

                let registeration = await db.get().collection(collection.REGISTRATION_COLLECTION).findOne({ _id: new ObjectId(regId) });

                resolve(registeration);
            } catch (error) {
                console.error("Error in getEventDetails:", error);
                reject(error);
            }
        });
    },

    getRegistrationCount: async (eventId, classId) => {
        try {
            return await db.get().collection(collection.REGISTRATION_COLLECTION).countDocuments({ eventId, classId });
        } catch (error) {
            console.error("Error fetching registration count:", error);
            throw error;
        }
    },

    registerEvent: async (eventId, userData, sessionData) => {
        try {
            const { participantName, regNum, email, phone, teamName, teamPhone, altPhone } = userData;
            const classId = sessionData.class;
            const userId = sessionData._id;

            const event = await module.exports.getEventDetails(eventId);
            if (!event) {
                return { status: false, message: "Event not found" };
            }

            const minParticipants = parseInt(event.minParticipants) || 1;
            const maxParticipants = parseInt(event.maxParticipants) || 10;

            let registrationData;

            if (event.eventStrength === "individual") {
                registrationData = {
                    eventId,
                    classId,
                    userId,
                    participant: { name: participantName, regNum, email, phone },
                    type: "individual",
                    timestamp: new Date(),
                };
            } else {
                // Ensure `teamMembers` and `teamRegNums` are arrays
                let teamMembers = userData["teamMembers[]"];
                let teamRegNums = userData["teamRegNums[]"];

                if (!Array.isArray(teamMembers)) {
                    teamMembers = teamMembers ? [teamMembers] : [];
                }
                if (!Array.isArray(teamRegNums)) {
                    teamRegNums = teamRegNums ? [teamRegNums] : [];
                }

                // Remove empty names and regNums
                const filteredTeamMembers = teamMembers.filter(name => name.trim() !== "");
                const filteredTeamRegNums = teamRegNums.filter(reg => reg.trim() !== "");

                if (filteredTeamMembers.length < minParticipants || filteredTeamMembers.length > maxParticipants) {
                    return { status: false, message: `Team size must be between ${minParticipants} and ${maxParticipants}` };
                }

                const team = filteredTeamMembers.map((name, index) => ({
                    name,
                    regNum: filteredTeamRegNums[index] || "N/A",
                }));

                registrationData = {
                    eventId,
                    classId,
                    userId,
                    teamName,
                    contact: { teamPhone, altPhone },
                    teamMembers: team,
                    type: "group",
                    timestamp: new Date(),
                };
            }

            await db.get().collection(collection.REGISTRATION_COLLECTION).insertOne(registrationData);
            return { status: true, message: "Registration successful" };
        } catch (error) {
            console.error("Error during event registration:", error);
            return { status: false, message: "Error processing registration" };
        }
    },

    getRegistrationsByCulturalRep: async (culturalRepId) => {
        try {
            const userIdString = culturalRepId.toString();

            // Fetch registrations for the given cultural representative
            const registrations = await db.get()
                .collection(collection.REGISTRATION_COLLECTION)
                .find({ userId: userIdString }) // Match userId as a string
                .toArray();

            console.log("Fetched Registrations:", registrations); // Debugging log

            if (registrations.length === 0) {
                console.log("No registrations found for user:", userIdString);
                return [];
            }

            // Extract unique event IDs and convert them to ObjectId
            const eventIds = [...new Set(registrations.map(reg => new ObjectId(reg.eventId)))];

            // Fetch event details using the converted event IDs
            const events = await db.get()
                .collection(collection.EVENT_COLLECTION)
                .find({ _id: { $in: eventIds } }) // Query with ObjectId
                .toArray();

            console.log("Fetched Events:", events); // Debugging log

            // Create a mapping of eventId (string) -> event details
            const eventMap = events.reduce((map, event) => {
                map[event._id.toString()] = event; // Store event using string key
                return map;
            }, {});

            // Attach event details to each registration
            registrations.forEach(reg => {
                reg.eventDetails = eventMap[reg.eventId] || { eventName: "Unknown Event" };
            });

            console.log("Final Registrations with Event Details:", registrations); // Debugging log

            return registrations;
        } catch (error) {
            console.error("Error fetching cultural rep registrations:", error);
            throw error;
        }
    },

    getClassRegistrations: async (eventId, classId) => {
        try {
            const registrations = await db.get()
                .collection(collection.REGISTRATION_COLLECTION)
                .find({
                    eventId: eventId.toString(), // Ensure it’s a string
                    classId: classId
                })
                .toArray();

            return registrations.length; // Return the count of registrations
        } catch (error) {
            console.error("Error fetching registrations for class:", error);
            return 0;
        }
    },

    deleteRegistration: async (regId, userId) => {
        console.log(regId, userId);

        const result = await db.get().collection(collection.REGISTRATION_COLLECTION).findOne({
            _id: new ObjectId(regId),
            userId: userId  // Keep userId as a string
        });
        console.log(result);



        try {
            const response = await db.get().collection(collection.REGISTRATION_COLLECTION).deleteOne({
                _id: new ObjectId(regId),  // Corrected field name
                userId: userId  // Keep userId as a string
            });
            console.log(response);

            if (response.deletedCount === 0) {
                return { status: false, message: "No registration found or already deleted." };
            }

            return { status: true, message: "Registration deleted successfully." };
        } catch (error) {
            console.error("Error deleting registration:", error);
            return { status: false, message: "Error processing registration deletion." };
        }
    },

    updateRegistration: async (eventId, userData, sessionData) => {
        try {
            console.log("User Data:", userData);
            console.log(sessionData._id);

            const userId = sessionData._id; // Ensure sessionData is passed correctly

            // Convert eventId and userId to ObjectId for database queries
            const event = await db.get().collection(collection.EVENT_COLLECTION).findOne({ _id: new ObjectId(eventId) });
            console.log(event);


            if (!event) {
                return { status: false, message: "Event not found" };
            }

            const minParticipants = parseInt(event.minParticipants) || 1;
            const maxParticipants = parseInt(event.maxParticipants) || 10;

            let updateData = {};

            if (event.eventStrength === "individual") {
                updateData = {
                    "participant.name": userData.participantName,
                    "participant.regNum": userData.regNum,
                    "participant.email": userData.email,
                    "participant.phone": userData.phone
                };
            } else {
                let teamMembers = userData["teamMembers[]"];
                let teamRegNums = userData["teamRegNums[]"];

                if (!Array.isArray(teamMembers)) {
                    teamMembers = teamMembers ? [teamMembers] : [];
                }
                if (!Array.isArray(teamRegNums)) {
                    teamRegNums = teamRegNums ? [teamRegNums] : [];
                }

                const filteredTeamMembers = teamMembers.filter(name => name.trim() !== "");
                const filteredTeamRegNums = teamRegNums.filter(reg => reg.trim() !== "");

                if (filteredTeamMembers.length < minParticipants) {
                    return {
                        status: false,
                        message: `Minimum ${minParticipants} team members are required.`,
                        showAlert: true
                    };
                }

                updateData = {
                    teamName: userData.teamName,
                    "contact.teamPhone": userData.teamPhone,
                    "contact.altPhone": userData.altPhone,
                    teamMembers: filteredTeamMembers.map((name, index) => ({
                        name,
                        regNum: filteredTeamRegNums[index] || "N/A",
                    }))
                };
            }

            // 🔹 **Check if Registration Exists Before Updating**
            const existingRegistration = await db.get().collection(collection.REGISTRATION_COLLECTION).findOne({
                eventId: eventId, // Keep as a string
                userId: userId // Keep as a string
            });

            console.log(existingRegistration);

            if (!existingRegistration) {
                return { status: false, message: "No existing registration found", showAlert: true };
            }

            // 🔹 **Use `updateOne()` to Modify Existing Registration**
            console.log("Updating registration for:", { eventId, userId, updateData });

            const result = await db.get().collection(collection.REGISTRATION_COLLECTION).updateOne(
                { eventId: eventId, userId: userId },  // Use as strings
                { $set: updateData }
            );

            console.log("Update result:", result);

            if (result.modifiedCount === 0) {
                return { status: false, message: "No changes made, or registration not found." };
            }

            return { status: true, message: "Registration updated successfully" };
        } catch (error) {
            console.error("Error updating registration:", error);
            return { status: false, message: "Error processing registration update" };
        }
    },

};
