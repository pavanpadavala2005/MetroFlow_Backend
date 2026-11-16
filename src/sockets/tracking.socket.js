
export const initializeTrackingSockets = (io) => {

    io.on("connection", (socket) => {

        console.log(
            `Passenger connected: ${socket.id}`
        );
        // SOCKET CONNECTION SUCCESS
        socket.emit("socket:ready", {
            success: true,
            message: "Connected to MetroFlow real-time server"
        });

        // SUBSCRIBE TO A STATION
        socket.on("station:subscribe", async (data = {}) => {

            const stationId = Number(data.stationId);

            if (
                !Number.isSafeInteger(stationId) ||
                stationId <= 0
            ) {
                socket.emit("socket:error", {
                    message: "Invalid station ID"
                });

                return;
            }

            const room = `station:${stationId}`;

            await socket.join(room);

            socket.emit("station:subscribed", {
                success: true,
                stationId,
                message: "Successfully subscribed to station updates"
            });

            console.log(
                `${socket.id} subscribed to ${room}`
            );
        });

        // UNSUBSCRIBE FROM A STATION
        socket.on("station:unsubscribe", async (data = {}) => {

            const stationId = Number(data.stationId);

            if (
                !Number.isSafeInteger(stationId) ||
                stationId <= 0
            ) {
                return;
            }

            const room = `station:${stationId}`;

            await socket.leave(room);

            socket.emit("station:unsubscribed", {
                success: true,
                stationId
            });
        });

        // SUBSCRIBE TO A METRO LINE
        socket.on("line:subscribe", async (data = {}) => {

            const lineId = Number(data.lineId);

            if (
                !Number.isSafeInteger(lineId) ||
                lineId <= 0
            ) {
                socket.emit("socket:error", {
                    message: "Invalid metro line ID"
                });

                return;
            }

            const room = `line:${lineId}`;

            await socket.join(room);

            socket.emit("line:subscribed", {
                success: true,
                lineId,
                message: "Successfully subscribed to metro line updates"
            });
        });

        // UNSUBSCRIBE FROM A METRO LINE
        socket.on("line:unsubscribe", async (data = {}) => {

            const lineId = Number(data.lineId);

            if (
                !Number.isSafeInteger(lineId) ||
                lineId <= 0
            ) {
                return;
            }

            await socket.leave(`line:${lineId}`);

            socket.emit("line:unsubscribed", {
                success: true,
                lineId
            });
        });

        // DISCONNECT
        socket.on("disconnect", (reason) => {

            console.log(
                `Passenger disconnected: ${socket.id}`,
                reason
            );
        });

    });
};
