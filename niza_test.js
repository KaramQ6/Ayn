async page => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173');
  await page.click('text=نزاع');
  await page.waitForTimeout(4000); // Allow map and details to render
  await page.screenshot({ path: 'dashboard_niza.png' });
}
