var redis = require("redis");

/**
 * Service which wraps a redis client, allowing the calling of application-specific storage functions.
 *
 * TODO:
 * Download all data
 * Retrieve livestream status/information
 * Update livestream status/information
 * Get all launch statuses
 * Add launch status
 * Remove launch status
 * Get specific launch status
 * Set specific launch status
 */
class StoreService {

    /**
     * Constructs a redis client.
     */
    constructor() {
        this.client = redis.createClient();
    }

    /**
     * Logs a websocket event to Redis.
     *
     * Pushes the event into the `events` list in Redis, and also adds `timestamp` (ISO8601 datetime string)
     * property to the data.
     *
     * @param eventName {string} The namespace that the event occurred under.
     * @param data {*} The message to log.
     * @param user? {User} An optional user to append as the creator of the action.
     *
     * @returns {Promise} Returns a promise that resolves to an object containing
     * the id and insertion timestamp.
     */
    log(eventName, data, user) {
        return new Promise((resolve, reject) => {

            let timestamp = (new Date()).toISOString();

            this.client.rpush("events", JSON.stringify({
                event: eventName,
                user: user ? user.username : null,
                timestamp: timestamp,
                body: data

            }), (err, response) => {
                return resolve({
                    id: response,
                    timestamp: timestamp
                });
            });
        });
    }

    /**
     * Getter and setter for the app activity status. If a boolean argument is passed through, the app activity status
     * will be set to the value of the arg. If `isAppActiveSetter` is undefined, the current app activity status
     * will be returned.
     *
     * @param isAppActiveSetter {boolean} Optional argument to set the current app activity status. Must be a boolean.
     *
     * @returns {Promise} If used as a getter, resolves with a boolean reply from the Redis store. Otherwise will
     * resolve/reject with no response.
     */
    isAppActive(isAppActiveSetter) {
        return new Promise((resolve, reject) => {
            if (isAppActiveSetter == undefined) {
                return this.client.get("isActive", (err, reply) => resolve(reply === "true"));

            } else if (isAppActiveSetter === true || isAppActiveSetter === false) {
                this.client.set("isActive", isAppActiveSetter);
                return resolve();
            }

            return reject();
        });
    }

    /**
     * Gets the launch state of the application.
     *
     * If launchProperty is not passed into the function, all fields from the launch hash will be retrieved.
     * If the launchProperty is a string, that specific field from the launch hash will be fetched. Otherwise,
     * the function will reject.
     *
     * @param launchProperty {undefined|string} Optional argument, that if set will return only that field from
     * the launch hash.
     *
     * @returns {Promise} Returns a promise that resolves to the launch hash or specific hash field.
     */
    getLaunch(launchProperty) {
        return new Promise((resolve, reject) => {
            if (launchProperty == undefined) {
                return this.client.hgetall("launch", (err, reply) => {

                    if (reply != null) {
                        Object.keys(reply).forEach(key => {
                            reply[key] = JSON.parse(reply[key]);
                        });
                    }

                    return resolve(reply);
                });

            } else if (typeof launchProperty === "string") {
                return this.client.hget("launch", launchProperty, (err, reply) => resolve(JSON.parse(reply)));

            }
            return reject();
        });
    }

    /**
     * Sets launch properties for the application.
     *
     * Inserts the keys and values of dataObj as the keys and values of fields on the `launch` hash in Redis.
     * If dataObj is null or undefined the function will reject.
     *
     * @param dataObj {*} An object of keys and values to be set on the `launch` hash in Redis.
     *
     * @returns {Promise} Returns a promise that resolves to the reply from Redis once the hash fields have been
     * set.
     */
    setLaunch(dataObj) {
        return new Promise((resolve, reject) => {

            Object.keys(dataObj).forEach(key => {
                dataObj[key] = JSON.stringify(dataObj[key]);
            });

            if (dataObj != null) {
                this.client.hmset("launch", dataObj, (err, reply) => {
                    resolve(reply);
                });
            } else {
                return reject();
            }
        });
    }

    getLivestream(livestreamKey) {

    }

    setLivestream(livestreamKey, dataObj) {

    }

    /**
     *
     *
     * @param data
     * @returns {Promise}
     */
    addLaunchStatus(data) {
        return new Promise((resolve, reject) => {
            this.client.rpush("launchStatuses", JSON.stringify(data), (err, index) => {

                data.statusId = index;

                this.client.lset("launchStatuses", index, (err, index) => {

                });
            });
        });
    }

    getStatuses() {
        return new Promise((resolve, reject) => {

        });
    }

    getEvents() {
        return new Promise((resolve, reject) => {

        });
    }

    beginTransaction() {
        return this;
    }
}

module.exports = StoreService;