const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // Blogger එකෙන් එන Request වලට ඉඩ දීම
});

// --- MongoDB Connection ---
const mongoURI = "mongodb+srv://flykites_admin:qoPcy7-sogvos-c@flykites.0zcr28y.mongodb.net/flykites_db?appName=FlyKites";

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ MongoDB Connected Successfully!'))
    .catch(err => console.log('❌ MongoDB Connection Error:', err));

// --- Game Logic ---
let currentMult = 1.00;
let isPlaying = false;
let targetCrash = 1.00;

function startGame() {
    isPlaying = true;
    currentMult = 1.00;
    // සර්වර් එක ඇතුළේ අහඹු ලෙස ක්‍රෑෂ් වෙන අංකය හැදීම (1.00x - 10.00x)
    targetCrash = (Math.random() * 9 + 1.00).toFixed(2); 
    console.log(`🚀 New Round Started! Will crash at: ${targetCrash}x`);

    let elapsed = 0;
    let gameInterval = setInterval(() => {
        elapsed += 0.05;
        currentMult += 0.01 * (1 + elapsed / 4);

        // සජීවීව සියලුම ක්‍රීඩකයින්ට Multiplier එක යැවීම
        io.emit('gameTick', { multiplier: currentMult.toFixed(2) });

        if (currentMult >= targetCrash) {
            clearInterval(gameInterval);
            isPlaying = false;
            // ක්‍රෑෂ් වුණ බව දැනුම් දීම
            io.emit('gameCrash', { crashPoint: targetCrash });

            // තත්පර 3කට පසුව ඊළඟ වටයේ ටයිමරය ආරම්භ කිරීම
            setTimeout(() => {
                io.emit('gameWaiting');
                setTimeout(startGame, 5000); // තත්පර 5කින් අලුත් වටයක්
            }, 3000);
        }
    }, 50);
}

// සර්වර් එක ඔන් වෙලා තත්පර 5කින් පළමු වටය ආරම්භ වේ
setTimeout(startGame, 5000);

// ක්‍රීඩකයින් සම්බන්ධ වීම
io.on('connection', (socket) => {
    console.log('👤 A player connected!');
});

app.get('/', (req, res) => {
    res.send("🚀 Fly Kites Game Server is Running!");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
});
