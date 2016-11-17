var SocketServer = require('socket.io');
var AuthenticationService = require('./services/AuthenticationService');

module.exports = {
    createServer: function(server) {
        var io = new SocketServer(server);
        var authenticationService = new AuthenticationService();

        /**
         * Handle incoming events.
         */
        io.on('connection', socket => {
            socket.on('msg:join', data => joinFn(data, socket));

            socket.on('msg:appStatus', data => appStatusFn(data, socket));
        });

        /**
         * `msg:join`. Called when a socket joins the pool. Socket is added to the correct rooms based on the data
         * passed to the function. Sockets which provide a correct token may be added to the moderator
         * and privileges rooms. Sockets which do not provide a token are added to the guest room.
         *
         * @param data  May contain a token property which can be checked for correctness. From there, the user
         * can be retrieved, and their privileges can be queried.
         *
         * @param socket The socket of concern.
         */
        var joinFn = function(data, socket) {

            if (data.token && authenticationService.isJsonWebTokenCorrect(data.token)) {

                authenticationService.getUser(data.token).then(user => {

                    if (user.privileges.includes('moderator')) {
                        socket.join('room:moderator');
                        console.log('moderator joined');
                    }
                });

                socket.join('room:privileges');
                console.log('privileges joined');
            } else {
                socket.join('room:guests');
                console.log('guest joined');
            }
        };

        /**
         *
         * @param data
         */
        var appStatusFn = function(data) {
            console.log(data); // http://socket.io/docs/rooms-and-namespaces/#default-room
        }
    }
};