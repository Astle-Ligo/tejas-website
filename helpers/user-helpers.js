var db = require('../config/connection');
var collection = require('../config/collection');
const { ObjectId } = require('mongodb');

module.exports = {
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

    getEventsGroupedByDate: async () => {
        try {
            const events = await db.get().collection(collection.EVENT_COLLECTION)
                .find()
                .sort({ eventDate: 1 }) // Sort by date in ascending order
                .toArray();

            const groupedEvents = Object.entries(
                events.reduce((acc, event) => {
                    if (!acc[event.eventDate]) {
                        acc[event.eventDate] = {
                            date: event.eventDate,
                            formattedDate: event.formattedDate,
                            location: event.venue || "TBA",
                            events: []
                        };
                    }
                    acc[event.eventDate].events.push({
                        time: event.eventTime || "TBA",
                        name: `${event.eventName}`,
                        subName: `${event.eventSubName}`
                    });
                    return acc;
                }, {})
            ).map(([date, data]) => data);
            console.log(groupedEvents[0]);

            return groupedEvents;
        } catch (error) {
            console.error("Database error:", error);
            throw error;
        }
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
}