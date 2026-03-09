/**
 * SharePoint Setup Helper
 * Run this script to get your SharePoint site ID and drive ID
 * 
 * Usage:
 * 1. Update the variables below with your info
 * 2. Get an access token from https://developer.microsoft.com/graph/graph-explorer
 * 3. Run: node scripts/get-sharepoint-ids.js
 */

const siteName = "YOUR_SITE_NAME"; // e.g., "KBM Construction Projects"
const accessToken = "YOUR_ACCESS_TOKEN"; // Get from Graph Explorer

async function getSharePointIds() {
  console.log("🔍 Searching for SharePoint site:", siteName);
  console.log("");

  try {
    // Step 1: Find the site
    const sitesResponse = await fetch(
      `https://graph.microsoft.com/v1.0/sites?search=${encodeURIComponent(siteName)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!sitesResponse.ok) {
      throw new Error(`Sites API error: ${sitesResponse.status} ${await sitesResponse.text()}`);
    }

    const sitesData = await sitesResponse.json();

    if (!sitesData.value || sitesData.value.length === 0) {
      console.error("❌ Site not found. Available sites:");
      console.log(sitesData);
      return;
    }

    const site = sitesData.value[0];
    console.log("✅ Site found:");
    console.log(`   Name: ${site.displayName}`);
    console.log(`   URL: ${site.webUrl}`);
    console.log(`   Site ID: ${site.id}`);
    console.log("");

    // Step 2: Get the drives (document libraries)
    const drivesResponse = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${site.id}/drives`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!drivesResponse.ok) {
      throw new Error(`Drives API error: ${drivesResponse.status} ${await drivesResponse.text()}`);
    }

    const drivesData = await drivesResponse.json();

    if (!drivesData.value || drivesData.value.length === 0) {
      console.error("❌ No document libraries found");
      return;
    }

    console.log("✅ Document libraries found:");
    drivesData.value.forEach((drive, index) => {
      console.log(`   ${index + 1}. ${drive.name}`);
      console.log(`      Drive ID: ${drive.id}`);
      console.log(`      Type: ${drive.driveType}`);
      console.log("");
    });

    const defaultDrive = drivesData.value[0];

    console.log("📝 Add these to your .env.local:");
    console.log("");
    console.log(`SHAREPOINT_SITE_ID=${site.id}`);
    console.log(`SHAREPOINT_DRIVE_ID=${defaultDrive.id}`);
    console.log("");
    console.log("✅ Setup complete!");

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log("");
    console.log("💡 Quick fix:");
    console.log("1. Go to https://developer.microsoft.com/graph/graph-explorer");
    console.log("2. Sign in with your Microsoft account");
    console.log("3. Grant permissions: Sites.Read.All");
    console.log("4. Copy your access token");
    console.log("5. Update this script and run again");
  }
}

// Only run if not imported as module
if (require.main === module) {
  if (siteName === "YOUR_SITE_NAME" || accessToken === "YOUR_ACCESS_TOKEN") {
    console.log("⚠️  Please update the script with your site name and access token");
    console.log("");
    console.log("Steps:");
    console.log("1. Open this file in an editor");
    console.log("2. Change 'YOUR_SITE_NAME' to your SharePoint site name");
    console.log("3. Get an access token from Graph Explorer:");
    console.log("   https://developer.microsoft.com/graph/graph-explorer");
    console.log("4. Run this script again");
    process.exit(1);
  }

  getSharePointIds();
}

module.exports = { getSharePointIds };
