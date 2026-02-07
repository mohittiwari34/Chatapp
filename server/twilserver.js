const twilio = require('twilio');

// Replace with your actual credentials from Twilio Console

const client = twilio(accountSid, authToken);

// Generate TURN credentials
async function getTurnCredentials() {
  try {
    const token = await client.tokens.create({
      ttl: 3600 // 1 hour expiry
    });
    
    // console.log('TURN Server Configuration:');
    // console.log(JSON.stringify(token.iceServers, null, 2));
    
    console.log(token.iceServers);
    return token.iceServers;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getTurnCredentials();

// {
//     credential: '8vd93mrH04UWxUT4HnNgsSXawEXM2JdcyONTycUo0AY=',
//     url: 'turn:global.turn.twilio.com:3478?transport=udp',
//     urls: 'turn:global.turn.twilio.com:3478?transport=udp',
//     username: '6d5ecda2e26a01b7190fa4cd181a5226a3f835b777776a2492f2eb992584e528'
//   },