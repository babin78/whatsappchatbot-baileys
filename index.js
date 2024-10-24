const {makeWASocket,useMultiFileAuthState,makeCacheableSignalKeyStore,DisconnectReason} = require('baileys') 
const P=require('pino')

const connectToWhatsApp=async  ()=> {

    const logger = P({ timestamp: () => `,"time":"${new Date().toJSON()}"` }, P.destination('./wa-logs.txt'))
    logger.level = 'trace'


    //const { state } = await useMultiFileAuthState('baileys_auth_info')
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    const sock = makeWASocket({
        // can provide additional config here
        printQRInTerminal: true,

        auth: {
			creds: state.creds,
			/** caching makes the store faster to send/recv messages */
			keys: makeCacheableSignalKeyStore(state.keys, logger),
		}
    })
    sock.ev.on ('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update || {}
        if(update?.qr){
            console.log(update?.qr)
        }
        
        if(connection === 'close') {
           console.log(lastDisconnect)
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
            // reconnect if not logged out

            connectToWhatsApp()
            
        } else if(connection === 'open') {
            console.log('opened connection')
        }
    })
    

    sock.ev.on('messages.upsert',async ( m) => {
        //console.log(JSON.stringify(m, undefined, 2))

        console.log(JSON.stringify(m))

        console.log('replying to', m?.messages[0].key.remoteJid)
        await sock.sendMessage(m?.messages[0].key.remoteJid, { text: 'Hello there!' })
    })


}

/*
async function connectToWhatsApp () {
    npm audit fix    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
            // reconnect if not logged out
            if(shouldReconnect) {
                connectToWhatsApp()
            }
        } else if(connection === 'open') {
            console.log('opened connection')
        }
    })
    sock.ev.on('messages.upsert', m => {
        console.log(JSON.stringify(m, undefined, 2))

        console.log('replying to', m.messages[0].key.remoteJid)
        await sock.sendMessage(m.messages[0].key.remoteJid!, { text: 'Hello there!' })
    })
}

*/
// run in main file
connectToWhatsApp()