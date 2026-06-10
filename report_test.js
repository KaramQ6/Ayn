async page => {
  await page.click('text=إرسال بلاغ');
  await page.waitForTimeout(3000); // Allow report form details to render
  await page.screenshot({ path: 'report.png' });
}
