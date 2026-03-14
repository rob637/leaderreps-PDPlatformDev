const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function seedSessionPrepConfigs() {
  const configs = [
    {
      id: 'session2-config',
      title: 'Session 2 Prep',
      description: 'Prepare for Session 2',
      milestone: 1,
      phase: 'foundation',
      actions: [
        {
          id: 'action-s2-download-guide',
          type: 'CONTENT',
          handlerType: 'download',
          label: 'Download/Print Session 2 Guide',
          prepSection: 'session2',
          required: true,
          optional: false
        },
        {
          id: 'action-s2-watch-video',
          type: 'CONTENT',
          handlerType: 'video',
          label: 'Watch Session 2 Video',
          prepSection: 'session2',
          required: true,
          optional: false
        }
      ]
    },
    {
      id: 'session3-config',
      title: 'Session 3 Prep',
      description: 'Prepare for Session 3',
      milestone: 2,
      phase: 'foundation',
      actions: [
        {
          id: 'action-s3-download-guide',
          type: 'CONTENT',
          handlerType: 'download',
          label: 'Download/Print Session 3 Guide',
          prepSection: 'session3',
          required: true,
          optional: false
        },
        {
          id: 'action-s3-watch-video',
          type: 'CONTENT',
          handlerType: 'video',
          label: 'Watch Session 3 Video',
          prepSection: 'session3',
          required: true,
          optional: false
        }
      ]
    },
    {
      id: 'session4-config',
      title: 'Session 4 Prep',
      description: 'Prepare for Session 4',
      milestone: 3,
      phase: 'foundation',
      actions: [
        {
          id: 'action-s4-download-guide',
          type: 'CONTENT',
          handlerType: 'download',
          label: 'Download/Print Session 4 Guide',
          prepSection: 'session4',
          required: true,
          optional: false
        },
        {
          id: 'action-s4-watch-video',
          type: 'CONTENT',
          handlerType: 'video',
          label: 'Watch Session 4 Video',
          prepSection: 'session4',
          required: true,
          optional: false
        }
      ]
    },
    {
      id: 'session5-config',
      title: 'Session 5 Prep',
      description: 'Prepare for Session 5',
      milestone: 4,
      phase: 'foundation',
      actions: [
        {
          id: 'action-s5-download-guide',
          type: 'CONTENT',
          handlerType: 'download',
          label: 'Download/Print Session 5 Guide',
          prepSection: 'session5',
          required: true,
          optional: false
        },
        {
          id: 'action-s5-watch-video',
          type: 'CONTENT',
          handlerType: 'video',
          label: 'Watch Session 5 Video',
          prepSection: 'session5',
          required: true,
          optional: false
        }
      ]
    }
  ];

  for (const config of configs) {
    const { id, ...data } = config;
    await db.collection('daily_plan_v1').doc(id).set({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ Created ${id}`);
  }

  console.log('\n✅ All session prep configs created!');
  process.exit(0);
}

seedSessionPrepConfigs();
