export const playNotificationSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // A pleasant "ding" sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1); // C6

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.error("Audio play failed", e);
    }
};

export const playIncomingCallSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // A longer "ringing" sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);

        // Pulse effect
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 1.0);
        gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 1.5);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.5);
    } catch (e) {
        console.error("Call audio failed", e);
    }
}
