# 📋 User Procedures: Managing Development Plan Content

This guide covers how to add content resources to the system and link them to specific weeks in the Development Plan.

---

## Table of Contents
1. [Overview](#overview)
2. [Step 1: Upload New Resources (The Vault)](#step-1-upload-new-resources-the-vault)
3. [Step 2: Link Resources to Development Plan Weeks](#step-2-link-resources-to-development-plan-weeks)
4. [Quick Reference: Supported Resource Types](#quick-reference-supported-resource-types)

---

## Overview

The system uses a **"Vault & Key" architecture**:

- **The Vault**: A centralized repository where all resources (videos, PDFs, links) are stored
- **The Key**: The Development Plan links these resources to specific weeks, controlling when users can access them

**Workflow Summary:**
1. Upload/create resources in the Content Manager (The Vault)
2. Link those resources to specific weeks using the Dev Plan Manager (The Key)

---

## Step 1: Upload New Resources (The Vault)

### Accessing the Content Manager

1. Log in as an **Admin** user
2. Navigate to **Admin Command Center** 
3. Select **Content** tab from the navigation
4. Choose the content type you want to add:
   - **Readings** - For PDFs, documents, and external links
   - **Videos** - For video content (uploaded MP4s or external URLs)

### Adding a New Resource

1. Click **"+ Add New"** button in the top right

2. Fill in the **required fields**:
   - **Title** - Display name for the resource (required)
   - **Description** - Brief summary of what the resource covers

3. Choose the **Resource Type**:

   **Option A: External Link**
   - Click "External Link" button
   - Enter the full URL (e.g., `https://docs.google.com/document/d/...`)
   - Works for: Google Docs, Sheets, Slides, YouTube, Vimeo, external websites

   **Option B: Upload File**
   - Click "Upload File" button
   - Click or drag a file to upload
   - Supported formats:
     - **Videos**: MP4, MOV, WebM
     - **Documents**: PDF, Word (.doc, .docx)
   - The file will be uploaded to Firebase Storage
   - A success message shows the uploaded file name

4. Set the **Tier** (access level):
   - **Free** - Available to all users
   - **Premium** - Only available to premium subscribers

5. Optional fields:
   - **Category** - Organizational tag (e.g., "leadership", "communication")
   - **Thumbnail URL** - Image preview for the resource

6. Check **"Active"** checkbox to make the resource available (default: on)

7. Click **"Save"** to create the resource

### Important Notes on Uploaded Files

- Files are stored in Firebase Storage under:
  - Videos: `resources/videos/`
  - Documents: `resources/documents/`
- Each file gets a unique timestamp prefix to prevent naming conflicts
- File metadata (name, size, type, path) is stored with the resource record
- The download URL is automatically generated and stored

---

## Step 2: Link Resources to Development Plan Weeks

### Accessing the Development Plan Manager

1. Log in as an **Admin** user
2. Navigate to **Admin Command Center**
3. Select **Development Plan** tab
4. You'll see a list of all weeks with their status

### Editing a Week to Add Resources

1. Find the week you want to edit in the list
2. Click the **pencil icon (Edit)** next to the week

3. Navigate to the **"Resources"** tab in the editor

### Adding Content Items to a Week

Under the **"Content Items (Unlocking)"** section:

1. Click **"+ Add Item"** to add a new content resource

2. For each content item, configure:

   **Resource Selection:**
   - Click the **"Select Resource..."** dropdown
   - A modal appears showing all available resources from The Vault
   - Use the **search bar** to filter by title or description
   - Click on a resource to select it
   - The resource ID, type, and thumbnail are automatically captured

   **Content Type:** Select from dropdown:
   - Workout
   - Read & Rep
   - Video
   - Reading
   - Tool
   - (Other types as defined in LOVs)

   **Label:** Display name shown to users (auto-fills from resource title, but can be customized)

   **Required:** Check the "Req" checkbox if this is required content (vs. optional/bonus)

3. To **remove** an item, click the **trash icon** next to it

### Adding Community Items to a Week

Under the **"Community Items"** section (blue):

1. Click **"+ Add Item"**

2. Configure:
   - **Resource**: Select from community resources
   - **Type**: Leader Circle, Forum, Ask the Trainer, etc.
   - **Label**: Display name
   - **Day**: Recommended day (e.g., "Thursday")

### Adding Coaching Items to a Week

Under the **"Coaching Items"** section (orange):

1. Click **"+ Add Item"**

2. Configure:
   - **Resource**: Select from coaching resources
   - **Type**: Open Gym, Live Coaching, 1:1, etc.
   - **Label**: Display name
   - **Optional**: Check if this is optional coaching

### Saving Your Changes

1. Review all added content, community, and coaching items
2. Click **"Save Changes"** in the top toolbar
3. The week document is saved to Firestore (`development_plan_v1/week-XX`)

---

## Quick Reference: Supported Resource Types

### Content Types (Videos & Readings)
| Type | Upload | External URL | Storage Path |
|------|--------|--------------|--------------|
| MP4 Video | ✅ | ✅ (YouTube/Vimeo) | `resources/videos/` |
| PDF Document | ✅ | ✅ (Google Docs) | `resources/documents/` |
| Word Document | ✅ | ✅ | `resources/documents/` |
| Google Docs/Sheets | ❌ | ✅ | N/A (external) |

### Firestore Collections
| Collection | Purpose |
|------------|---------|
| `content_readings` | PDF, document, and article resources |
| `content_videos` | Video content |
| `content_community` | Community activity resources |
| `content_coaching` | Coaching resources |
| `development_plan_v1` | Week configurations (links to resources) |

### Resource Schema (What's Stored)
```javascript
{
  title: "Resource Title",
  description: "Brief description",
  url: "https://... or Firebase Storage URL",
  tier: "free" | "premium",
  category: "leadership",
  thumbnail: "https://...",
  isActive: true,
  metadata: {
    isUploadedFile: true,      // for uploaded files
    fileName: "original.pdf",
    fileSize: 1234567,
    fileType: "application/pdf",
    storagePath: "resources/documents/..."
  }
}
```

### Week Content Item Schema (The Link)
```javascript
{
  contentItemId: "resource_id_from_vault",
  resourceId: "resource_id_from_vault",
  resourceType: "video" | "reading",
  resourceThumbnail: "https://...",
  contentItemType: "Workout" | "Read & Rep" | "Video",
  contentItemLabel: "Display Name",
  isRequiredContent: true
}
```

---

## Troubleshooting

### Resource Not Appearing in Selector
- Ensure the resource is **active** (isActive: true)
- Check that you uploaded to the correct collection (Videos vs. Readings)
- Refresh the page and try again

### Upload Failed
- Check file size (large videos may timeout)
- Verify file format is supported
- Check browser console for specific error messages

### Resource Not Showing for Users
- Verify the week is **not in Draft mode** (uncheck "Draft Mode" in Identity tab)
- Check user's current week - resources only appear when the week is unlocked
- Confirm the resource is marked as **Active**

---

## Tips & Best Practices

1. **Naming Convention**: Use descriptive titles like "Week 3 - Feedback Framework Workout"

2. **Thumbnails**: Add thumbnails for a better user experience - videos especially benefit from preview images

3. **Test Before Publish**: Use the **Time Traveler** tool in Admin to preview what users see in different weeks

4. **Draft Mode**: Keep weeks in draft until all content is linked and tested

5. **Categories**: Use consistent categories across resources for easier filtering

6. **Tier Consistency**: Ensure all content for a premium week is marked as premium tier

---

*Last Updated: December 2024*
