import CDP from 'chrome-remote-interface';
import fs from 'fs';

async function capture() {
    let client;
    try {
        client = await CDP();
        const {Page, Emulation, Runtime} = client;
        
        await Page.enable();
        await Runtime.enable();
        
        console.log('Navigating to http://localhost:5173/?preview=og...');
        await Page.navigate({url: 'http://localhost:5173/?preview=og'});
        await Page.loadEventFired();
        
        // Wait a bit for fonts/noise overlay to load
        console.log('Waiting for content to settle...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const width = 1200;
        const height = 630;
        
        console.log(`Setting viewport to ${width}x${height}...`);
        
        await Emulation.setDeviceMetricsOverride({
            width: width,
            height: height,
            deviceScaleFactor: 2, // High DPI for crispness
            mobile: false
        });
        
        console.log('Capturing screenshot...');
        const {data} = await Page.captureScreenshot({
            format: 'png',
            clip: {
                x: 0,
                y: 0,
                width: width,
                height: height,
                scale: 1
            },
            fromSurface: true
        });
        
        fs.writeFileSync('public/og-image.png', Buffer.from(data, 'base64'));
        console.log('OG Image saved to public/og-image.png');
        
    } catch (err) {
        console.error('Error during screenshot:', err);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

capture();
