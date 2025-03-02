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
    }

};
