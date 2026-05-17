# Evidence-Based Health Chatbot - User Guide

## Phase 4 Features

Welcome to the enhanced Evidence-Based Health Chatbot! This guide will help you navigate all the new features.

---

## 🚀 Getting Started

### First Time User?

When you first visit the chatbot, you'll see:

1. **Profile Setup Modal** - Fill out your health profile for personalized recommendations
2. **Welcome Tips** - Quick start guide with helpful information
3. **Help Panel** - Comprehensive guide (purple question mark icon)

**Tip:** Setting up your profile is optional but highly recommended for personalized advice!

---

## 🎯 Main Features

### 1. Health Profile

**Location:** Green edit icon (✏️) in the top header

**What to Include:**

- Age band
- Diagnosed conditions
- Current medications
- Allergies/intolerances
- Dietary pattern (omnivore, vegetarian, vegan, etc.)
- Cuisine preferences
- Budget level
- Health goals

**Why It Matters:** Your profile helps the chatbot provide personalized, safe, and relevant recommendations.

---

### 2. Quick Action Buttons

Located below the chat when you have messages:

| Button                | What It Does                                             |
| --------------------- | -------------------------------------------------------- |
| 🍽️ **Meal Plan**      | Generates a personalized meal plan based on your profile |
| 💊 **Supplements**    | Opens the supplement safety checker                      |
| 🏥 **Doctor Summary** | Creates a summary to share with your healthcare provider |
| 🧘 **Audio Scripts**  | Shows guided meditation and breathing exercises          |
| 📅 **Progress**       | Opens your goal and habit tracker                        |
| 📅 **Weekly Plan**    | Creates a comprehensive weekly self-care plan            |

---

### 3. Clinician Summary (NEW!)

**How to Use:**

- Click "Doctor Summary" button, OR
- Ask: "Generate a summary for my doctor"

**What You Get:**
A professionally formatted summary including:

- Your profile information
- Topics discussed
- Recommendations with evidence levels
- Safety concerns
- Questions to ask your doctor
- Next steps

**Export It:** Use the download button to save and share with your healthcare provider!

---

### 4. Export Your Data (NEW!)

**Location:** Blue download icon (⬇️) in header

**Export Formats:**

1. **📝 Markdown (.md)**
   - Human-readable format
   - Good for emailing or printing
   - Includes formatting and structure

2. **📊 JSON (.json)**
   - Structured data format
   - Can import back later
   - Includes full conversation history

3. **📄 Plain Text (.txt)**
   - Simple text file
   - Easy to print
   - Universal compatibility

4. **🏥 FHIR Bundle (.json)**
   - Healthcare standard format
   - Compatible with electronic health records
   - Can be imported into clinical systems

**Export Options:**

- ☑️ Include Profile Information
- ☑️ Include Full Conversation

**Tip:** Export as FHIR to share with healthcare systems!

---

### 5. Import Previous Data (NEW!)

**Location:** Orange upload icon (📤) in header (visible when you have messages)

**What You Can Import:**

1. **Previous Chat (JSON)**
   - Restore a previous conversation
   - Recovers your profile too
   - ⚠️ Warning: Overwrites current session

2. **FHIR Patient Resource**
   - Import profile from healthcare system
   - Extracts conditions, medications, goals
   - Compliant with health data standards

**How to Use:**

1. Click import icon
2. Select import type
3. Choose your file
4. Data restores automatically!

---

### 6. Health Insights Dashboard (NEW!)

**Location:** Blue bar chart icon (📊) in header

**What You See:**

### 📊 Conversation Analytics

- Total number of conversations
- Topics you've discussed most
- Frequency of different health topics

### 📈 Evidence Quality Breakdown

- Strong evidence recommendations: X%
- Moderate evidence: X%
- Limited evidence: X%
- Visual bar chart showing distribution

### 🛡️ Safety Tracking

- Emergency flags triggered
- Warnings provided
- Safety interventions

**Why It's Useful:** Track your health journey and see what topics you focus on most!

---

### 7. Accessibility Features (NEW!)

**Location:** Purple accessibility icon (♿) in header

**Available Settings:**

### 📖 Reading Level

- **Simple** - 8th grade reading level (easier to understand)
- **Standard** - Default level
- **Technical** - Clinical terminology

### 📏 Text Size

- Small
- Medium (default)
- Large
- Extra Large

Adjust based on your comfort and vision needs!

### 🎨 High Contrast Mode

- Increases contrast to AAA level
- Better visibility
- Easier on the eyes
- Great for visual impairments

### 🗣️ Screen Reader Optimized

- Enhanced labels for screen readers
- Live updates announced
- Keyboard shortcut hints visible

**All settings saved automatically!**

---

### 8. Keyboard Shortcuts (NEW!)

**For Power Users:**

| Shortcut        | Action                   |
| --------------- | ------------------------ |
| `Enter`         | Send message             |
| `Shift + Enter` | New line in message      |
| `Escape`        | Close all modals/panels  |
| `Tab`           | Navigate through buttons |
| `Ctrl/Cmd + K`  | Focus on input field     |

**View Full List:** Open accessibility panel → Keyboard Shortcuts section

---

### 9. Help & Information

#### Help Panel

**Location:** Purple question mark icon (❓)

**Contains:**

- What the chatbot does
- Evidence level explanations
- When to see a doctor vs. use chatbot
- Safety features overview
- Tips for best results
- Export guidance

#### Privacy Notice

**Location:** Orange privacy icon (🔒)

**Contains:**

- What data is stored (locally only!)
- API usage disclosure
- How to clear your data
- Security recommendations

**Your Privacy:** All health data stays in YOUR browser. Nothing is stored on our servers.

---

## 🧘 Additional Tools

### Supplement Checker

- Check safety and interactions
- View evidence levels
- Get food source alternatives
- See typical dosages

### Audio Scripts Library

- Guided breathing exercises
- Meditation practices
- Pain management techniques
- Sleep wind-down scripts
- Urge surfing for cravings
- Self-compassion practices

### Progress Tracker

- Set weekly goals
- Track daily check-ins
- Build habit streaks
- Log health metrics (optional)
- View progress over time

---

## 💡 Tips for Best Results

### 1. Set Up Your Profile

Complete your profile for personalized recommendations tailored to your specific health conditions and goals.

### 2. Be Specific

Instead of: "Help me eat better"
Try: "Create a Mediterranean meal plan for managing hypertension on a moderate budget"

### 3. Ask for Structured Outputs

- "Create a meal plan" → Gets structured weekly plan
- "Make a shopping list" → Gets categorized list with checkboxes
- "Give me a recipe" → Gets formatted recipe card

### 4. Use Quick Actions

Save time by clicking quick action buttons instead of typing full requests.

### 5. Export for Your Doctor

Before appointments, use "Doctor Summary" to create a professional summary to share.

### 6. Track Your Progress

Use the Progress Tracker to set goals and build healthy habits over time.

---

## 🛡️ Safety Features

### Automatic Emergency Detection

The chatbot automatically detects:

- Medical emergencies (chest pain, stroke symptoms)
- Mental health crises (suicidal thoughts)
- Dangerous medication changes
- High-risk combinations

**What Happens:** Immediate safety information and guidance to call 911/crisis lines.

### Medication Interaction Warnings

The supplement checker cross-references your medications to identify potential interactions.

### Evidence Transparency

Every recommendation includes an evidence level:

- ✓ Strong evidence (green)
- ⚬ Moderate evidence (blue)
- △ Limited evidence (orange)
- ✗ Not recommended (red)

---

## ⚠️ Important Reminders

### This Chatbot IS FOR:

- ✅ Learning about lifestyle interventions
- ✅ Understanding evidence-based approaches
- ✅ Meal planning and nutrition guidance
- ✅ Supplement safety information
- ✅ Behavior change support
- ✅ Educational information

### This Chatbot IS NOT FOR:

- ❌ Medical diagnosis
- ❌ Prescribing medications
- ❌ Emergency medical care
- ❌ Replacing your healthcare provider
- ❌ Interpreting test results
- ❌ Acute medical conditions

### When to See a Doctor:

- New or worsening symptoms
- Abnormal test results
- Medication decisions
- Need for diagnosis
- Acute illness or injury
- Any concerning symptoms

---

## 🔧 Troubleshooting

### Message Not Sending?

- Check your internet connection
- Your draft is saved automatically
- The chatbot will retry automatically (up to 2 times)

### Lost Connection?

- Your message is saved as a draft
- Refresh the page
- Your conversation history is preserved

### Want to Start Fresh?

- Click the red trash icon (🗑️)
- Confirms before deleting
- Cannot be undone!

### Export Not Working?

- Ensure your browser allows downloads
- Check if popup blocker is interfering
- Try a different export format

### Profile Not Saving?

- Check if cookies/localStorage are enabled
- Clear browser cache and try again
- Re-enter your profile information

---

## 📱 Mobile Usage

All features work on mobile devices:

- Touch-friendly buttons
- Responsive layout
- Swipe gestures supported
- All modals mobile-optimized

**Tip:** Use landscape mode for better visibility of larger modals!

---

## 🔐 Privacy & Data

### Where Is My Data?

All your health information is stored **locally in your browser** using localStorage. Nothing is sent to our servers for storage.

### What About API Calls?

Messages are sent to OpenAI's API to generate responses, but OpenAI does not retain your data for training purposes.

### Can Others See My Data?

No! Your data is private and stored only on your device.

### How Do I Delete My Data?

1. Click the red trash icon for chat history
2. Clear your browser's localStorage
3. Delete is immediate and permanent

### Using on Public Computers?

⚠️ Not recommended! If you must:

- Use incognito/private mode
- Export and delete after use
- Don't save sensitive information

---

## 🆘 Need More Help?

1. **Click the Help icon (❓)** - Comprehensive guide inside the app
2. **Check the Privacy Notice (🔒)** - Understand how your data is handled
3. **Use Accessibility Panel (♿)** - Customize your experience

---

## ✨ Pro Tips

1. **Export Regularly:** Save important conversations for your records
2. **Use Insights:** Track what you discuss most to identify patterns
3. **Set Goals:** Use Progress Tracker to build sustainable habits
4. **Try Audio Scripts:** Great for stress relief and mindfulness
5. **Share with Your Doctor:** Export clinician summaries before appointments
6. **Adjust Accessibility:** Customize text size and contrast for comfort
7. **Learn Shortcuts:** Keyboard navigation saves time
8. **Import Old Chats:** Continue previous conversations seamlessly

---

## 📞 Emergency Resources

**Medical Emergencies:** Call 911 (US), 999 (UK), or 112 (EU)

**Mental Health Crisis:**

- 🇺🇸 US: Call/text 988 (Suicide & Crisis Lifeline)
- 🇬🇧 UK: Call 116 123 (Samaritans)
- 🇪🇺 EU: Visit befrienders.org for local resources

**Crisis Text Lines:**

- 🇺🇸 US: Text "HELLO" to 741741
- 🇬🇧 UK: Text "SHOUT" to 85258

---

**Remember:** This chatbot is a supportive educational tool, not a replacement for professional medical care. Always consult your healthcare provider for medical decisions.

**Your health journey, your way. We're here to support you! 💚**

---

_Last Updated: May 13, 2026_  
_Phase 4: Clinical Integration & Advanced Features_
