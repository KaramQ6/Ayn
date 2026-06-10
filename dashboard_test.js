async page => {
  await page.goto('http://localhost:5173');
  await page.click('text=فيّ');
  await page.waitForTimeout(4000); // Allow map tiles and data to load
  await page.screenshot({ path: 'dashboard.png' });
}
