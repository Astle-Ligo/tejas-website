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
                    // Group Registration - Include Team Name & Contact
                    participants.push({
                        _id: reg._id.toString(),
                        teamName: reg.teamName || "Unnamed Team",
                        class: reg.classId,
                        teamMembers: reg.teamMembers.map(member => ({
                            name: member.name,
                            regNum: member.regNum
                        })),
                        contact: {
                            teamPhone: reg.contact?.teamPhone || "N/A",
                            altPhone: reg.contact?.altPhone || "N/A"
                        },
                        timestamp: reg.timestamp?.$date || "N/A",
                        type: "group"
                    });
                } else if (reg.type === "individual" && reg.participant) {
                    // Individual Registration - Include Name, Reg Number & Phone
                    participants.push({
                        _id: reg._id.toString(),
                        name: reg.participant.name,
                        regNum: reg.participant.regNum,
                        class: reg.classId,
                        phone: reg.participant.phone || "N/A",
                        timestamp: reg.timestamp?.$date || "N/A",
                        type: "individual"
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
            console.log("Event Head ID:", eventHeadId);

            const dbInstance = db.get();
            if (!dbInstance) throw new Error("Database connection is not initialized.");

            console.log("Raw resultData:", resultData);

            // Convert IDs to ObjectId
            const eventId = ObjectId.isValid(resultData.eventId) ? new ObjectId(resultData.eventId) : null;
            const firstPlace = ObjectId.isValid(resultData.firstPlace) ? new ObjectId(resultData.firstPlace) : null;
            const secondPlace = ObjectId.isValid(resultData.secondPlace) ? new ObjectId(resultData.secondPlace) : null;
            const thirdPlace = ObjectId.isValid(resultData.thirdPlace) ? new ObjectId(resultData.thirdPlace) : null;
            eventHeadId = ObjectId.isValid(eventHeadId) ? new ObjectId(eventHeadId) : null;

            if (!eventId || !eventHeadId) {
                throw new Error("Invalid ObjectId provided.");
            }

            console.log("✅ All ObjectIds are valid:", { eventId, firstPlace, secondPlace, thirdPlace, eventHeadId });

            // Fetch participant details
            const fetchParticipant = async (participantId) => {
                if (!participantId) return null;
                return await dbInstance.collection(collection.REGISTRATION_COLLECTION).findOne({ _id: participantId });
            };

            const firstPlaceReg = await fetchParticipant(firstPlace);
            const secondPlaceReg = await fetchParticipant(secondPlace);
            const thirdPlaceReg = await fetchParticipant(thirdPlace);

            console.log("First Place:", firstPlaceReg);
            console.log("Second Place:", secondPlaceReg);
            console.log("Third Place:", thirdPlaceReg);

            eventName = await db.get().collection(collection.EVENT_COLLECTION).findOne({ _id: eventId })
            console.log(eventName.eventName);

            // Format participant details with unique ID for each position
            const formatResult = (registration, position, points) => {
                if (!registration) return null;

                const baseDetails = {
                    _id: new ObjectId(), // Assign unique _id for each result entry
                    classId: registration.classId || "Unknown",
                    position,
                    points,
                };

                if (registration.type === "individual") {
                    return {
                        ...baseDetails,
                        type: "individual",
                        participant: {
                            name: registration.participant?.name || "Unknown",
                            regNum: registration.participant?.regNum || "N/A",
                            phone: registration.participant?.phone || "N/A",
                        },
                    };
                } else if (registration.type === "group") {
                    return {
                        ...baseDetails,
                        type: "group",
                        teamName: registration.teamName || "Unknown",
                        contact: {
                            teamPhone: registration.contact?.teamPhone || "N/A",
                            altPhone: registration.contact?.altPhone || "N/A",
                        },
                        teamMembers: registration.teamMembers?.map(member => ({
                            name: member.name,
                            regNum: member.regNum,
                        })) || [],
                    };
                }

                return null;
            };

            // Format and assign unique _id for each result
            const results = [
                formatResult(firstPlaceReg, "First", 25),
                formatResult(secondPlaceReg, "Second", 15),
                formatResult(thirdPlaceReg, "Third", 10)
            ].filter(result => result !== null); // Remove null entries if any

            // Save results to database
            await dbInstance.collection(collection.RESULTS_COLLECTION).updateOne(
                { eventId },
                {
                    $set: {
                        eventId,
                        eventName: eventName.eventName,
                        eventHeadId,
                        results,
                        timestamp: new Date(),
                    },
                },
                { upsert: true }
            );

            console.log("✅ Results saved successfully.");
            return { success: true, message: "Results saved successfully." };
        } catch (error) {
            console.error("❌ Error saving event results:", error);
            return { success: false, message: error.message };
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
                    $unwind: "$results" // Unwind the results array
                },
                {
                    $group: {
                        _id: "$eventId",
                        eventName: { $first: "$eventName" },
                        eventId: { $first: "$eventId" },
                        firstPlace: {
                            $push: {
                                $cond: { if: { $eq: ["$results.position", "First"] }, then: "$results", else: "$$REMOVE" }
                            }
                        },
                        secondPlace: {
                            $push: {
                                $cond: { if: { $eq: ["$results.position", "Second"] }, then: "$results", else: "$$REMOVE" }
                            }
                        },
                        thirdPlace: {
                            $push: {
                                $cond: { if: { $eq: ["$results.position", "Third"] }, then: "$results", else: "$$REMOVE" }
                            }
                        }
                    }
                }
            ]).toArray();

            console.log("Fetched Results for Event Head:", results);
            return results;
        } catch (error) {
            console.error("Error fetching results:", error);
            throw error;
        }
    },

    getResultByEvent: async (eventId) => {
        try {
            if (!ObjectId.isValid(eventId)) {
                console.error("Invalid ObjectId:", eventId);
                return null;
            }

            const result = await db.get().collection(collection.RESULTS_COLLECTION).findOne({
                eventId: new ObjectId(eventId)
            });

            // console.log("Query Result:", result);
            return result;
        } catch (error) {
            console.error("Error fetching result:", error);
            return null;
        }
    },


    // editResult: async (data) => {
    //     const { eventId, resultId, firstPlace, secondPlace, thirdPlace } = data;

    //     console.log(data);

    //     // Validate Event ID and Result ID
    //     if (!eventId || !ObjectId.isValid(eventId)) throw new Error("Invalid or missing Event ID.");
    //     if (!resultId || !ObjectId.isValid(resultId)) throw new Error("Invalid or missing Result ID.");

    //     console.log("Event ID:", eventId);
    //     console.log("Result ID:", resultId);

    //     const validateId = (id) => (id && ObjectId.isValid(id) ? new ObjectId(id) : null);

    //     // Convert participant IDs if valid
    //     const firstPlaceId = validateId(firstPlace);
    //     const secondPlaceId = validateId(secondPlace);
    //     const thirdPlaceId = validateId(thirdPlace);

    //     // Helper function to fetch participant details
    //     const getParticipantDetails = async (participantId) => {
    //         if (!participantId) return null;
    //         return await db.get().collection(collection.REGISTRATION_COLLECTION).findOne(
    //             { _id: participantId },
    //             { projection: { classId: 1, teamName: 1, name: 1, type: 1, contact: 1, teamMembers: 1, regNum: 1, phone: 1 } }
    //         );
    //     };

    //     // Fetch details only if IDs are provided
    //     const firstPlaceData = firstPlaceId ? await getParticipantDetails(firstPlaceId) : null;
    //     const secondPlaceData = secondPlaceId ? await getParticipantDetails(secondPlaceId) : null;
    //     const thirdPlaceData = thirdPlaceId ? await getParticipantDetails(thirdPlaceId) : null;

    //     // Prepare update query dynamically
    //     let updateFields = {};

    //     const participantsData = [
    //         { id: firstPlaceId, data: firstPlaceData, position: "First", points: 25 },
    //         { id: secondPlaceId, data: secondPlaceData, position: "Second", points: 15 },
    //         { id: thirdPlaceId, data: thirdPlaceData, position: "Third", points: 10 },
    //     ];

    //     // Iterate over participantsData to dynamically create the update fields
    //     participantsData.forEach(({ id, data, position, points }) => {
    //         if (data) {
    //             updateFields[`results.$[elem]`] = {
    //                 position,
    //                 _id: id,
    //                 classId: data.classId,
    //                 points,
    //                 ...(data.type === "group"
    //                     ? { teamName: data.teamName, contact: data.contact, teamMembers: data.teamMembers }
    //                     : { participant: { name: data.name, regNum: data.regNum, phone: data.phone } })
    //             };
    //         }
    //     });

    //     console.log("Looking for eventId:", eventId);
    //     console.log("Checking if teams exist:", firstPlace, secondPlace, thirdPlace);

    //     if (Object.keys(updateFields).length === 0) {
    //         throw new Error("No valid participant data provided.");
    //     }

    //     // Perform the database update
    //     return db.get().collection(collection.RESULTS_COLLECTION).updateOne(
    //         { _id: new ObjectId(eventId), "results._id": new ObjectId(resultId) },
    //         { $set: updateFields },
    //         {
    //             arrayFilters: [{ "elem.position": { $in: ["First", "Second", "Third"] } }]
    //         }
    //     );
    // },

    deleteResult: async (eventId) => {
        console.log(eventId);

        if (!ObjectId.isValid(eventId)) {
            console.error("Invalid ObjectId:", eventId);
            return false;
        }
        const deleteResponse = await db.get().collection(collection.RESULTS_COLLECTION).deleteOne({
            eventId: new ObjectId(eventId),
        });

        return deleteResponse.deletedCount === 1;
    },


    addWhatsAppLink: async (eventId, whatsappLink) => {
        try {
            await db.get().collection(collection.EVENT_COLLECTION).updateOne(
                { _id: new ObjectId(eventId) },
                { $set: { whatsappLink } }
            );
            return true;
        } catch (error) {
            console.error("Error adding WhatsApp link:", error);
            throw new Error("Unable to add WhatsApp link.");
        }
    },

}