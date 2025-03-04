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
                            location: event.venue || "TBA",
                            events: []
                        };
                    }
                    acc[event.eventDate].events.push({
                        time: event.timeLimit || "TBA",
                        name: `${event.eventName} - ${event.eventSubName}`
                    });
                    return acc;
                }, {})
            ).map(([date, data]) => data);

            return groupedEvents;
        } catch (error) {
            console.error("Database error:", error);
            throw error;
        }
    }
}