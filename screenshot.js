import CDP from 'chrome-remote-interface';
import fs from 'fs';

async function capture() {
    let client;
    try {
        client = await CDP();
        const {Page, Emulation, Runtime, Log, Network} = client;
        
        await Page.enable();
        await Runtime.enable();
        await Log.enable();
        await Network.enable();

        Network.responseReceived((params) => {
            if (params.response.status === 404) {
                console.log('404 RESOURCE:', params.response.url);
            }
        });

        client.on('Runtime.consoleAPICalled', (params) => {
            console.log('BROWSER CONSOLE:', ...params.args.map(a => a.value || a.description));
        });

        client.on('Log.entryAdded', (params) => {
            console.log('BROWSER LOG:', params.entry.text);
        });
        
        console.log('Navigating to http://localhost:5173/?preview=og...');
        await Page.navigate({url: 'http://localhost:5173/?preview=og'});
        await Page.loadEventFired();
        
        // Wait for PCD and fonts
        console.log('Waiting for content to settle (20 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 20000));
        
        const width = 1200;
        const height = 630;
        
        console.log(`Setting viewport to ${width}x${height}...`);
        
        await Emulation.setDeviceMetricsOverride({
            width: width,
            height: height,
            deviceScaleFactor: 1, // 1200x630 keeps the grain from bloating the file
            mobile: false
        });
        
        console.log('Capturing screenshot...');
        const {data} = await Page.captureScreenshot({
            format: 'jpeg',
            quality: 90,
            clip: {
                x: 0,
                y: 0,
                width: width,
                height: height,
                scale: 1
            },
            fromSurface: true
        });
        
        fs.writeFileSync('public/og-image.jpg', Buffer.from(data, 'base64'));
        console.log('OG Image saved to public/og-image.jpg');
        
    } catch (err) {
        console.error('Error during screenshot:', err);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

capture();
