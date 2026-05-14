import CDP from 'chrome-remote-interface';
import fs from 'fs';

async function capture() {
    let client;
    try {
        client = await CDP();
        const {Page, Emulation, Runtime} = client;
        
        await Page.enable();
        await Runtime.enable();
        
        console.log('Navigating to http://localhost:5173...');
        await Page.navigate({url: 'http://localhost:5173'});
        await Page.loadEventFired();
        
        // Wait a bit for animations/dynamic content (especially since it's a 3D portfolio)
        console.log('Waiting for content to settle...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Get the full page metrics
        const {contentSize} = await Page.getLayoutMetrics();
        const width = Math.ceil(contentSize.width);
        const height = Math.ceil(contentSize.height);
        
        console.log(`Setting viewport to ${width}x${height}...`);
        
        await Emulation.setDeviceMetricsOverride({
            width: width,
            height: height,
            deviceScaleFactor: 1,
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
            fromSurface: true,
            captureBeyondViewport: true
        });
        
        fs.writeFileSync('screenshot.png', Buffer.from(data, 'base64'));
        console.log('Screenshot saved to screenshot.png');
        
    } catch (err) {
        console.error('Error during screenshot:', err);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

capture();
