async page => {
  // Set viewport size for consistent premium screenshots
  await page.setViewportSize({ width: 1440, height: 900 });

  // 1. Landing Page
  console.log('Loading landing page...');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'landing.png' });

  // 2. Go to Operations Dashboard (Fayy Fire)
  console.log('Navigating to Fayy Fire unit...');
  await page.click('text=فيّ');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'dashboard_fayy.png' });

  // 3. Switch to Najji Flood Unit
  console.log('Navigating to Najji Flood unit...');
  await page.click('text=نجّي');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'dashboard_najji.png' });


  // 5. Switch to Shuaa Solar Unit
  console.log('Navigating to Shuaa Solar unit...');
  await page.click('text=شعاع');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'dashboard_shuaa.png' });

  // 6. Switch to Baydar Agriculture Unit
  console.log('Navigating to Baydar Agriculture unit...');
  await page.click('text=بيدر');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'dashboard_baydar.png' });

  // 7. Switch to Riyah Dust Unit
  console.log('Navigating to Riyah Dust unit...');
  await page.click('text=رياح');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'dashboard_riyah.png' });

  // 7.5. Switch to Niza Conflict Unit
  console.log('Navigating to Niza Conflict unit...');
  await page.click('text=نزاع');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'dashboard_niza.png' });

  // 8. Go to Analytics Tab
  console.log('Navigating to Analytics...');
  await page.click('text=التحليلات');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'analytics.png' });

  // 9. Go to Report Form Tab
  console.log('Navigating to Report Form...');
  await page.click('text=إرسال بلاغ');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'report.png' });

  console.log('All screenshots captured successfully.');
}
