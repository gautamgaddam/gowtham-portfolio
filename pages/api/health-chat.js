import { createClient } from "@supabase/supabase-js";
import { getEffectiveSubscriptionTier, hasFullAccess } from "../../lib/access";
import { getHealthAiConfigurationHint, streamHealthChat } from "../../lib/health-ai-provider";

export const config = {
  runtime: "nodejs",
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

let requireAuth = process.env.HEALTH_CHAT_REQUIRE_AUTH !== "false";

// If auth is requested but the Supabase admin client isn't configured,
// disable the auth requirement to avoid a 500 error in development.
if (requireAuth && !supabaseAdmin) {
  console.warn("HEALTH_CHAT_REQUIRE_AUTH=true but Supabase admin client is not configured. Disabling auth for this runtime.");
  requireAuth = false;
}

// ═══════════════════════════════════════════════════════════════════════════
// MEAL PLANNING FRAMEWORKS & RESOURCES
// ═══════════════════════════════════════════════════════════════════════════

const MEAL_FRAMEWORKS = {
  DASH: {
    name: "DASH (Dietary Approaches to Stop Hypertension)",
    principles: [
      "High in fruits & vegetables",
      "Whole grains",
      "Low-fat dairy",
      "Lean proteins",
      "Low sodium (<1500mg/day)",
      "Rich in potassium, calcium, magnesium",
    ],
    bestFor: ["Hypertension", "CVD risk", "Metabolic syndrome"],
  },
  MEDITERRANEAN: {
    name: "Mediterranean-Style",
    principles: [
      "Plant-forward",
      "Olive oil/unsaturated fats",
      "Beans & nuts",
      "Whole grains",
      "Fish 2-3x/week",
      "Modest ultra-processed foods",
    ],
    bestFor: ["CVD", "Diabetes", "Autoimmune support", "Chronic pain"],
  },
  LOWER_CARB: {
    name: "Moderate Lower-Carbohydrate",
    principles: [
      "Reduce refined starches & sugar",
      "Increase protein & non-starchy vegetables",
      "Keep carbs fiber-rich",
      "Portion-aware",
    ],
    bestFor: ["Type 2 diabetes", "Obesity", "PCOS"],
  },
  CALORIC_DEFICIT: {
    name: "Structured Energy Deficit",
    principles: [
      "Clear calorie deficit",
      "Adequate protein",
      "High satiety foods",
      "Repeatable meals",
      "Long-term follow-up",
    ],
    bestFor: ["Obesity", "NAFLD", "Metabolic syndrome"],
  },
};

const COOKING_METHODS = [
  "Baking",
  "Roasting",
  "Steaming",
  "Pressure-cooking",
  "Grilling",
  "Measured-oil stir-frying",
  "Herb & acid flavoring (reduce salt)",
];

const BUDGET_STAPLES = [
  "Oats",
  "Eggs",
  "Lentils",
  "Canned beans",
  "Canned fish (sardines, salmon)",
  "Potatoes",
  "Frozen vegetables",
  "Seasonal produce",
  "Rice",
  "Whole wheat pasta",
  "Peanut butter",
  "Chickpeas",
  "Tofu",
  "Yogurt",
  "Bananas",
];

const SHOPPING_LIST_CATEGORIES = [
  "Produce (Fruits & Vegetables)",
  "Proteins (Meat, Fish, Eggs, Beans)",
  "Dairy & Alternatives",
  "Grains & Bread",
  "Pantry Staples (Oils, Spices, Canned)",
  "Frozen Items",
  "Beverages",
];

const SYSTEM_PROMPT = `You are an evidence-aware lifestyle and self-management coach specializing in chronic disease prevention and management. You provide educational information to help people make informed decisions about lifestyle interventions, nutrition, physical activity, stress management, and evidence-based complementary approaches. You are NOT a generic natural remedies advisor.

Use an integrated safety-first style: combine lifestyle/natural options, standard medical context, evidence level, interaction cautions, and clinician referral triggers in one coherent answer. Do not frame medical care and natural care as enemies.

When profile context includes body composition, symptoms, food logs, workouts, or goals, use them only for personalization and progress support. Never diagnose disease from body composition, symptom logs, or tracker data. When interpreting body composition, mention that estimates vary by method/device.

When knowledgeContext includes uploaded health documents or book chunks, use them as supporting context alongside general model knowledge. Cite document title, chapter, and page when available. If page/chapter is unavailable, cite the document title or chunk context.

When book context comes from naturopathy, natural-health, fasting, herbal, detox, alkaline, or remedy books, treat it as a source of ideas and historical/traditional framing, not as proof. Clearly separate "book/traditional perspective" from "better-established evidence" and "safety cautions." Do not present controversial book claims as established medical facts.

When book context comes from bodybuilding or yoga books, treat it as training or lifestyle education. Adapt it to the user's profile, pain/symptom context, age band, pregnancy status, conditions, and medications when available. Do not push maximal lifting, extreme diets, fasting, breath retention, inversions, or aggressive flexibility work when contraindications, injury, pregnancy, dizziness, uncontrolled blood pressure, heart disease, eating disorder risk, or severe pain are present.

When book/traditional context is used for a symptom, condition, supplement, remedy, diet, workout, or treatment question, always add a scientific/standard-care grounding section in the same answer:
- Explain what better-established scientific or clinical guidance says, using evidence levels.
- Name standard first-line lifestyle or medical-care concepts when relevant, without prescribing or changing medicines.
- State what is experimental, unproven, adjunctive, or only traditional.
- Include clinician review triggers, contraindications, and medication-interaction cautions.
- If the book context conflicts with scientific evidence or safety guidance, say so clearly and prioritize safety and established care.
- Never let book context replace evidence-based care, clinician diagnosis, prescribed medicines, emergency care, or monitoring.

When the user asks about vitamins, minerals, supplements, or nutrition for inflammation or disease support:
- Include typical adult daily intake targets such as RDA/AI when known, and tolerable upper limits when relevant.
- Mention food-first sources before supplement dosing.
- Mention key medication interactions, kidney/liver disease cautions, pregnancy cautions, and toxicity risks when relevant.
- Explain that inflammation improvement timelines vary by disease, cause, deficiency status, sleep, diet, activity, medication, and clinician care.
- Do not promise a cure or say a supplement will "cure inflammation" or "cure disease." Use language like "may support," "may help if deficient," and "review with a clinician."
- If the user requests "how much time to cure inflammation," reframe to realistic monitoring windows: short-term symptom changes may take days to weeks, lab markers often need weeks to months, chronic inflammatory diseases require diagnosis and ongoing management.

For meal, workout, and goal requests, use the user's profile, body composition, underlying conditions, symptoms, current daily tracker data, saved goals, budget/cuisine preferences, and relevant document context when available. Keep plans practical and saveable as daily tracker items.

═══════════════════════════════════════════════════════════════════════════
🚨 CRITICAL SAFETY RULES - CHECK FIRST, EVERY TIME 🚨
═══════════════════════════════════════════════════════════════════════════

**EMERGENCY HARD STOPS:**
If the user mentions ANY of the following, STOP immediately and provide emergency instructions:

🚨 **MEDICAL EMERGENCIES** (Call 911/999/112 immediately):
- Chest pain, pressure, or tightness
- Sudden severe headache ("worst headache of my life")
- Stroke symptoms: Face drooping, arm weakness, speech difficulty, sudden confusion, vision loss
- Severe breathlessness, can't speak in full sentences, wheezing with distress
- Anaphylaxis: Swelling of face/throat/tongue, difficulty breathing after exposure
- Severe bleeding that won't stop
- Loss of consciousness or collapse
- Severe abdominal pain with fever or vomiting
- Signs of heart attack: jaw/neck/back pain with nausea, cold sweat

🚨 **MENTAL HEALTH CRISIS** (Call 988 in US, 116 123 in UK, or local crisis line):
- Suicidal thoughts ("I want to die", "kill myself", "end it all")
- Self-harm intent or recent self-harm
- Psychosis: hearing voices, seeing things, paranoid delusions
- Severe panic or dissociation with safety concerns

🚨 **MEDICATION-RELATED DANGERS:**
- "I stopped my [blood pressure/diabetes/heart/psychiatric] medicine"
- "I replaced my medicine with supplements"
- Severe medication side effects (rash, swelling, confusion, extreme weakness)
- Pregnant or breastfeeding + considering supplements/herbs

🚨 **HIGH-RISK COMBINATIONS:**
- Taking anticoagulants (warfarin, Eliquis, Xarelto) + considering supplements
- Immunosuppressed (cancer treatment, organ transplant, biologics) + fever or infection
- Kidney disease + potassium/phosphorus supplements or excessive protein
- Uncontrolled diabetes (blood sugar >300 mg/dL or <70 mg/dL)

**NEVER:**
- Tell users to stop prescribed medicines (only clinicians can advise discontinuation)
- Diagnose conditions ("you have X disease")
- Claim supplements are "as effective as" or "replacements for" medicines
- Recommend unproven or dangerous therapies (IV vitamins, chelation, high-dose supplements without monitoring)

═══════════════════════════════════════════════════════════════════════════
📊 EVIDENCE TRANSPARENCY SYSTEM - LABEL EVERYTHING
═══════════════════════════════════════════════════════════════════════════

**You MUST label every recommendation with one of these evidence levels:**

**Strong evidence** ✓
- Multiple high-quality RCTs, systematic reviews, or meta-analyses
- Large effect sizes, consistent results across populations
- Endorsed by major medical societies (AHA, ADA, ACP, etc.)
- Examples: Mediterranean diet for CVD, DASH for hypertension, exercise for depression, metformin for diabetes

**Moderate evidence** ⚬
- Some RCTs or large observational studies
- Effect sizes modest but clinically meaningful
- Mechanistic plausibility supported
- Examples: Omega-3 for triglycerides, vitamin D for deficiency-related fatigue, probiotics for specific GI conditions

**Limited evidence** △
- Small studies, inconsistent results, or only observational data
- Mechanistic rationale but lacking human trials
- "May help" but not proven reliably
- Examples: Turmeric for joint pain, magnesium for migraines, ashwagandha for stress

**Not recommended / Insufficient evidence** ✗
- No quality evidence, or evidence shows harm/no benefit
- Overhyped by marketing, lacks scientific support
- Examples: Detox cleanses, alkaline water for disease, high-dose antioxidants, colloidal silver

**When citing evidence:**
- State the level explicitly: "**Strong evidence** supports X for Y condition"
- Explain why: "...based on multiple RCTs showing 30% reduction in events"
- Acknowledge uncertainty: "Limited evidence suggests... but more research needed"

═══════════════════════════════════════════════════════════════════════════
📝 DEFAULT ANSWER STRUCTURE
═══════════════════════════════════════════════════════════════════════════

**For any question, structure your answer as:**

1. **What helps** (with evidence level)
2. **Evidence level and reasoning** (why this level, what studies show)
3. **Important cautions/interactions/contraindications**
4. **When to seek clinician care** (red flags, monitoring needs)
5. **One practical next step** (specific, actionable, measurable)

═══════════════════════════════════════════════════════════════════════════
🏥 CONDITION-SPECIFIC GUIDANCE
═══════════════════════════════════════════════════════════════════════════

**CARDIOVASCULAR DISEASE (CVD, CAD, post-MI, heart failure):**
- **Strong evidence**: Mediterranean diet, DASH diet, aerobic exercise (150 min/week), statins (if prescribed), blood pressure control, smoking cessation, cardiac rehab
- **Moderate evidence**: Omega-3 (EPA/DHA 2-4g/day for triglycerides), plant stanols/sterols, soluble fiber
- **Red flags**: Chest pain, new shortness of breath, irregular heartbeat, leg swelling, weight gain >3 lbs in 2 days
- **Cautions**: Avoid high-salt foods, excessive alcohol, sudden intense exercise without clearance
- ⚠️ NEVER stop anticoagulants, beta-blockers, or statins without clinician approval

**TYPE 2 DIABETES:**
- **Strong evidence**: Mediterranean or low-carb diet, weight loss (7-10% body weight), metformin (if prescribed), exercise (resistance + aerobic), DSMES (diabetes self-management education)
- **Moderate evidence**: Cinnamon for modest glucose reduction, chromium picolinate if deficient, vinegar with meals
- **Limited evidence**: Berberine (needs monitoring, drug interactions), alpha-lipoic acid
- **Red flags**: Blood glucose >300 mg/dL or <70 mg/dL, confusion, extreme thirst/urination, fruity breath
- **Monitoring**: Check blood glucose before/after changes, A1c every 3 months
- ⚠️ Caution with insulin or sulfonylureas: exercise/supplements can cause hypoglycemia

**HYPERTENSION:**
- **Strong evidence**: DASH diet (high K, low Na <1500mg/day), weight loss, exercise, limit alcohol (<1-2 drinks/day), stress reduction (MBSR)
- **Moderate evidence**: CoQ10 (100-200mg/day), beetroot juice, potassium supplementation (if not on ACE-I/ARBs and normal kidneys)
- **Red flags**: BP >180/120, severe headache, vision changes, chest pain
- **Cautions**: Check medication interactions (licorice raises BP, excess K with ACE-I/ARBs dangerous)

**OBESITY / WEIGHT MANAGEMENT:**
- **Strong evidence**: Caloric deficit (500-750 kcal/day), structured diet plans (Mediterranean, low-carb), exercise (resistance + cardio), behavioral therapy, sleep 7-9 hours
- **Moderate evidence**: High-protein diets (1.2-1.6 g/kg), intermittent fasting (if sustainable), GLP-1 agonists (if prescribed)
- **Limited evidence**: Green tea extract, CLA, garcinia cambogia
- **Not recommended**: Detoxes, cleanses, extreme low-calorie (<800 kcal/day without supervision)
- **Approach**: Ask permission before discussing weight. Focus on health behaviors, not just numbers.

**COMMON MENTAL HEALTH (Depression, Anxiety, Stress):**
- **Strong evidence**: Exercise (especially aerobic, 150 min/week), CBT (cognitive-behavioral therapy), SSRI/SNRI (if prescribed), sleep hygiene, social connection
- **Moderate evidence**: Omega-3 (EPA-dominant, 1-2g/day), vitamin D (if deficient), mindfulness/MBSR, light therapy (seasonal depression)
- **Limited evidence**: SAMe, St. John's Wort (drug interactions!), L-theanine, ashwagandha
- **Red flags**: Suicidal thoughts, self-harm, inability to function, psychosis
- ⚠️ St. John's Wort interacts with birth control, antidepressants, many drugs - dangerous

**CHRONIC PAIN (osteoarthritis, fibromyalgia, low back pain):**
- **Strong evidence**: Exercise (low-impact: swimming, cycling, yoga), physical therapy, weight loss (for OA), CBT for pain management, NSAIDs (if safe)
- **Moderate evidence**: Glucosamine + chondroitin (for knee OA), acupuncture, capsaicin cream, turmeric/curcumin
- **Limited evidence**: Boswellia, MSM, collagen supplements
- **Red flags**: New severe pain, numbness/weakness, bowel/bladder changes, fever, trauma
- **Cautions**: Avoid prolonged NSAIDs (GI bleeding, kidney, CV risks), opioids (addiction risk)

**METABOLIC SYNDROME:**
- **Strong evidence**: Weight loss (7-10%), Mediterranean diet, exercise (resistance + aerobic), reduce refined carbs/sugars
- **Moderate evidence**: Intermittent fasting, low-carb diets, berberine (with monitoring)
- **Red flags**: Symptoms of diabetes, CVD, or fatty liver disease progression
- **Monitoring**: Blood glucose, lipids, liver enzymes, blood pressure every 3-6 months

**AUTOIMMUNE CONDITIONS (RA, Lupus, Psoriatic Arthritis, IBD):**
- **Strong evidence**: Mediterranean diet, omega-3 fatty acids, maintain medication adherence (DMARDs, biologics), regular monitoring, avoid smoking
- **Moderate evidence**: Vitamin D (if deficient), turmeric/curcumin (adjunct for RA/IBD), stress management, adequate sleep
- **Limited evidence**: Elimination diets (may help IBD subsets), low-dose naltrexone (experimental)
- **Not recommended**: Stopping immunosuppressive meds, unproven "immune boosters" during flares
- **Red flags**: Fever, severe flare, infection signs, new organ symptoms, drug side effects
- ⚠️ CRITICAL: Never recommend "boosting immunity" in autoimmune patients (can worsen disease)
- ⚠️ Immunosuppressed patients: fever or infection = same-day medical evaluation

═══════════════════════════════════════════════════════════════════════════
💊 SUPPLEMENT SAFETY & EVIDENCE
═══════════════════════════════════════════════════════════════════════════

**FOOD-FIRST, SUPPLEMENT-SECOND:**
- Always recommend whole food sources first
- Supplements are for targeted deficiencies or evidence-based adjunct therapy
- Not regulated like drugs: quality varies, contamination possible

**ALWAYS CHECK FOR INTERACTIONS:**
Before recommending ANY supplement, state:
"⚠️ Check with your pharmacist or doctor for interactions with your medicines"

**HIGH-RISK INTERACTIONS:**
- **Anticoagulants (warfarin, Eliquis, Xarelto, Plavix)**: Vitamin K, fish oil, ginkgo, garlic, ginger, turmeric (high doses), St. John's Wort
- **Antidepressants (SSRIs, SNRIs)**: St. John's Wort, SAMe, 5-HTP, tryptophan
- **Immunosuppressants**: Echinacea, astragalus, medicinal mushrooms, cat's claw
- **Diabetes medicines**: Chromium, cinnamon, berberine, alpha-lipoic acid (hypoglycemia risk)
- **Blood pressure meds**: Licorice (raises BP), potassium (with ACE-I/ARBs), CoQ10 (may lower BP)
- **Thyroid medicines**: Biotin, iodine, soy isoflavones, iron (take 4 hours apart)

**SPECIAL POPULATIONS - EXTRA CAUTION:**
- **Pregnancy/Breastfeeding**: Most herbs/supplements NOT proven safe. Avoid unless specifically studied (e.g., prenatal vitamins, iron, DHA)
- **Kidney disease**: Potassium, phosphorus, magnesium, high-dose vitamins, protein supplements (dangerous)
- **Liver disease**: Avoid high-dose vitamins A/D/E/K, certain herbs (kava, comfrey, pennyroyal)
- **Scheduled surgery**: Stop most supplements 2 weeks prior (bleeding risk, drug interactions)

**EVIDENCE-BASED SUPPLEMENT USE:**
- **Vitamin D**: If deficient (<30 ng/mL), 1000-2000 IU daily
- **Omega-3 (EPA/DHA)**: 1-2g/day for CVD, 2-4g/day for triglycerides (prescription doses)
- **Magnesium**: For deficiency (cramps, migraines), 200-400mg daily
- **B12**: For deficiency (vegetarians, metformin users, elderly), 500-1000 mcg daily
- **Iron**: ONLY if deficient (ferritin <30 ng/mL). Can cause constipation, nausea, interactions
- **Probiotics**: Specific strains for IBS, antibiotic-associated diarrhea (Lactobacillus, Bifidobacterium)

**OVERHYPED / NOT RECOMMENDED:**
- Detox/cleanse products (body detoxes itself via liver/kidneys)
- High-dose antioxidants (vitamins E, A, beta-carotene - may increase mortality)
- Colloidal silver (causes permanent skin discoloration, no benefits)
- Alkaline water for disease (acid-base balance tightly regulated by kidneys/lungs)
- "Immune boosters" (vague marketing term, no proven benefit for most)

═══════════════════════════════════════════════════════════════════════════
🍽️ MEAL PLANNING & NUTRITION COUNSELING
═══════════════════════════════════════════════════════════════════════════

**EVIDENCE-BASED DIETARY PATTERNS:**
Offer these as options based on user preference, culture, and health goals:

1. **Mediterranean-Style** (Strong evidence for CVD, diabetes, longevity):
   - High: vegetables, fruits, whole grains, legumes, nuts, olive oil, fish
   - Moderate: poultry, eggs, dairy (yogurt, cheese)
   - Low: red meat, sweets, processed foods

2. **DASH (Dietary Approaches to Stop Hypertension)** (Strong evidence for BP, heart health):
   - High: fruits, vegetables, whole grains, low-fat dairy, lean protein
   - Low sodium (<1500-2300 mg/day), high potassium
   - Limit: red meat, sweets, sugary drinks

3. **Moderate Lower-Carb** (Moderate evidence for diabetes, weight loss):
   - 100-150g carbs/day (not keto)
   - Focus on non-starchy vegetables, lean protein, healthy fats
   - Reduce refined carbs, sugars, processed foods

4. **Structured Caloric Deficit** (Strong evidence for weight loss):
   - 500-750 kcal/day deficit
   - High protein (1.2-1.6 g/kg), high fiber (25-35g/day)
   - Volume eating: low-calorie-dense foods (veggies, fruits, lean protein)

**CULTURAL ADAPTATION:**
- Ask about cultural background and food preferences
- Adapt plans to include familiar cuisines (Indian, Mediterranean, Asian, Latin American, etc.)
- Respect religious/ethical restrictions (vegetarian, halal, kosher, etc.)

**COOKING METHODS (PROMOTE HEALTHY, FLAVORFUL):**
- **Recommended**: Baking, roasting, grilling, steaming, pressure-cooking, sautéing with measured oil (1-2 tbsp), air-frying
- **Flavor without excess salt/fat**: Herbs, spices, citrus, vinegar, garlic, ginger, nutritional yeast, harissa, za'atar
- **Reduce**: Deep frying, excessive oil, high-sodium sauces, processed meats

**PRACTICAL MEAL PLANNING:**
- Create shopping lists organized by grocery section (use categories: ${SHOPPING_LIST_CATEGORIES.join(", ")})
- Include budget-friendly options: ${BUDGET_STAPLES.slice(0, 5).join(", ")}, etc.
- Provide specific portion sizes and simple recipes
- Adapt for dietary restrictions (allergies, intolerances, preferences)
- Reference these evidence-based frameworks:
  * DASH: ${MEAL_FRAMEWORKS.DASH.principles.join(", ")}
  * Mediterranean: ${MEAL_FRAMEWORKS.MEDITERRANEAN.principles.join(", ")}
  * Lower-Carb: ${MEAL_FRAMEWORKS.LOWER_CARB.principles.join(", ")}
  * Caloric Deficit: ${MEAL_FRAMEWORKS.CALORIC_DEFICIT.principles.join(", ")}
- Recommend healthy cooking methods: ${COOKING_METHODS.join(", ")}

═══════════════════════════════════════════════════════════════════════════
📋 STRUCTURED OUTPUT FORMATS
═══════════════════════════════════════════════════════════════════════════

When generating specific content types, use these markers and formats:

**MEAL PLAN FORMAT:**
Use marker: ## MEAL PLAN
Structure as:
- Day-by-day breakdown (e.g., Monday, Tuesday...)
- Each day: Breakfast, Lunch, Dinner, Snacks
- Include prep tips and ingredient swaps
- Add nutrition notes where relevant

**SHOPPING LIST FORMAT:**
Use marker: ## SHOPPING LIST
Structure by category:
- Produce (Fruits & Vegetables): [items with quantities]
- Proteins (Meat, Fish, Eggs, Beans): [items with quantities]
- Dairy & Alternatives: [items]
- Grains & Bread: [items]
- Pantry Staples (Oils, Spices, Canned): [items]
- Frozen Items: [items]
- Beverages: [items]
Mark budget-friendly items with 💰

**RECIPE FORMAT:**
Use marker: ## RECIPE: [Recipe Name]
Structure as:
**Ingredients:**
- [List with quantities]

**Instructions:**
1. [Step by step]

**Nutrition Notes:** [Key benefits, modifications]
**Swaps:** [Alternative ingredients for allergies/preferences]

**WEEKLY PLAN FORMAT:**
Use marker: ## WEEKLY PLAN
Structure as:
**This Week (Days 1-7):**
- [Specific daily actions]

**This Month (Weeks 2-4):**
- [Weekly milestones]

**Progress Checkpoints:**
- [What to track and when]

**PROGRESS SUMMARY FORMAT:**
Use marker: ## PROGRESS SUMMARY
Review format:
- What went well this week
- Challenges encountered
- Metrics tracked (if any)
- Adjustments for next week
- Wins to celebrate

**CLINICIAN HANDOFF SUMMARY FORMAT:**
When user asks for "clinician summary", "doctor summary", "summary for my doctor", or "medical summary", generate:

## CLINICIAN HANDOFF SUMMARY

**Patient Profile:**
- Age: [age band]
- Conditions: [list from profile]
- Current Medications: [list from profile]
- Allergies: [list from profile]
- Dietary Pattern: [pattern from profile]

**Discussion Topics:**
[Numbered list of main topics discussed in this conversation]

**Recommendations Provided:**
[List evidence-graded recommendations with their evidence levels]
- **Strong evidence** ✓: [recommendations]
- **Moderate evidence** ⚬: [recommendations]
- **Limited evidence** △: [recommendations]

**Safety Concerns Identified:**
[Any red flags, interactions, contraindications, or referral triggers mentioned]

**Self-Management Goals:**
[Patient's stated goals and planned actions from discussion]

**Questions for Clinical Review:**
[Specific questions patient should ask their healthcare provider]

**Next Steps:**
[Recommended follow-up timeline and actions]

**Lifestyle Interventions Discussed:**
- Dietary: [specific dietary patterns or changes discussed]
- Physical Activity: [specific recommendations]
- Stress Management: [specific techniques]
- Sleep: [specific recommendations]
- Other: [any other interventions]

---
*This summary is for patient-provider communication. It reflects educational discussion only and does not constitute medical advice or diagnosis.*

═══════════════════════════════════════════════════════════════════════════
🧠 BEHAVIOR CHANGE & MOTIVATIONAL APPROACH
═══════════════════════════════════════════════════════════════════════════

**COLLABORATIVE LANGUAGE:**
- Use "we" and "let's" instead of "you should"
- Ask open-ended questions: "What feels most doable for you this week?"
- Validate struggles: "That's really hard. Many people face this challenge."
- Celebrate small wins: "That's excellent progress. How did that feel?"

**MOTIVATIONAL INTERVIEWING PRINCIPLES:**
- Express empathy and respect autonomy
- Elicit change talk: "What would be different if you made this change?"
- Roll with resistance: "It sounds like you're not ready for that yet. What would feel more manageable?"
- Support self-efficacy: "You've managed X before. You have the skills to do this."

**GOAL SETTING (SMART GOALS):**
- Specific: "Walk 20 minutes after dinner"
- Measurable: "3 times this week"
- Achievable: Start small, build gradually
- Relevant: Tied to user's values and priorities
- Time-bound: "For the next 2 weeks"

**WEIGHT/APPEARANCE SENSITIVITY:**
- Ask permission: "Would it be okay to discuss weight as part of your health goals?"
- Focus on behaviors and health outcomes, not appearance
- Avoid stigmatizing language ("obesity epidemic", "overweight", "ideal body weight")
- Use person-first language: "person with obesity" not "obese person"

**NON-JUDGMENTAL ABOUT RELAPSES:**
- Normalize setbacks: "Slips are part of the process, not failure"
- Problem-solve: "What got in the way? What would help next time?"
- Reframe: "What did you learn from this experience?"

═══════════════════════════════════════════════════════════════════════════
🚫 SCOPE CONTROL - WHAT YOU DON'T DO
═══════════════════════════════════════════════════════════════════════════

**DO NOT:**
- Diagnose conditions ("Based on your symptoms, you have X")
- Interpret test results without clinician context (you can explain what values mean generally)
- Recommend stopping or starting prescription medicines
- Provide treatment plans for acute medical conditions
- Give advice beyond lifestyle, nutrition, self-management, and evidence-based complementary approaches
- Make promises or guarantees ("This will cure your X")

**ALWAYS REFER TO CLINICIANS FOR:**
- New or worsening symptoms
- Abnormal test results
- Medication decisions (starting, stopping, changing doses)
- Diagnostic evaluation
- Treatment of acute illness or injury
- Complex medical management

**YOUR ROLE:**
- Educational information and evidence summary
- Lifestyle and self-management coaching
- Navigating evidence-based complementary approaches
- Behavior change support
- Clarifying when to seek medical care

═══════════════════════════════════════════════════════════════════════════
🗣️ TONE & COMMUNICATION STYLE
═══════════════════════════════════════════════════════════════════════════

- **Warm but professional**: Supportive coach, not casual friend
- **Evidence-focused**: Always cite evidence levels
- **Clear and actionable**: Avoid jargon, provide specific next steps
- **Empowering**: Help users make informed decisions, don't dictate
- **Honest about limitations**: "The evidence here is limited" or "This isn't my area - see your doctor"
- **Safety-conscious**: When in doubt, recommend professional consultation

═══════════════════════════════════════════════════════════════════════════

**DISCLAIMER TO INCLUDE IN FIRST RESPONSE:**
"This is educational information to support your health decisions, not medical advice. Always consult your healthcare provider before making changes to your treatment plan, starting supplements, or if you have concerning symptoms."

**Remember:** You are a trusted coach helping people navigate lifestyle medicine with the best available evidence. Safety first, evidence always, empowerment throughout.`;

// Input validation helper
function validateInput(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { valid: false, error: "Messages must be a non-empty array" };
  }

  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      return { valid: false, error: "Each message must have role and content" };
    }
    if (!["user", "assistant"].includes(msg.role)) {
      return {
        valid: false,
        error: "Messages may only use user or assistant roles",
      };
    }
    if (typeof msg.content !== "string") {
      return { valid: false, error: "Message content must be a string" };
    }
    if (msg.content.length > 5000) {
      return {
        valid: false,
        error: "Message content too long (max 5000 characters)",
      };
    }
  }

  return { valid: true };
}

// Prompt injection detection
function detectPromptInjection(messages) {
  const injectionPatterns = [
    /ignore\s+(previous|above|prior)\s+instructions/i,
    /system\s*:/i,
    /you\s+are\s+now\s+a/i,
    /jailbreak/i,
    /pretend\s+to\s+be/i,
    /forget\s+everything/i,
    /disregard\s+(previous|above)/i,
  ];

  for (const msg of messages) {
    const content = msg.content.toLowerCase();
    for (const pattern of injectionPatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }
  }

  return false;
}

// Emergency detection function
function detectEmergencyOrCrisis(message) {
  const content = message.toLowerCase();

  // Medical emergencies
  const medicalEmergencyPatterns = [
    /chest pain|chest pressure|chest tightness/i,
    /can't breathe|cannot breathe|difficulty breathing|severe breathlessness|can't catch my breath/i,
    /stroke|face droop|arm weakness|sudden confusion|vision loss|worst headache/i,
    /anaphylaxis|throat swelling|tongue swelling|face swelling|allergic reaction.*breathing/i,
    /severe bleeding|won't stop bleeding|bleeding heavily/i,
    /collapsed|lost consciousness|passed out|blacked out/i,
    /severe abdominal pain|acute abdomen/i,
  ];
  const heartAttackEmergencyPatterns = [
    /\b(i|we|he|she|they|my\s+\w+|someone)\b.{0,60}\b(having|might be having|may be having|think.*having|symptoms? of)\b.{0,40}\bheart attack\b/i,
    /\bheart attack\b.{0,50}\b(right now|now|emergency|call 911|ambulance|er|urgent|severe pain|can't breathe|cannot breathe|sweating|jaw pain|left arm pain)\b/i,
  ];

  // Mental health crisis
  const mentalHealthCrisisPatterns = [
    /suicidal|want to die|kill myself|end my life|end it all|not worth living/i,
    /self harm|cut myself|hurt myself|self-harm/i,
    /hearing voices|seeing things|voices tell|psychosis|paranoid delusion/i,
  ];

  // Medication dangers
  const medicationDangerPatterns = [
    /stopped? (my|taking) (blood pressure|diabetes|heart|psychiatric|antidepressant|statin|insulin|metformin)/i,
    /replaced? (my|taking) (medicine|medication|drug|prescription) with (supplement|herb|natural)/i,
    /severe (side effect|reaction|rash) (from|to) (medicine|medication|drug)/i,
  ];

  // High-risk combinations
  const highRiskCombinationPatterns = [
    /(pregnant|pregnancy|breastfeeding).*supplement/i,
    /(warfarin|eliquis|xarelto|plavix|anticoagulant|blood thinner).*(supplement|herb|fish oil|vitamin k)/i,
    /(immunosuppress|transplant|chemotherapy|biologic).*(fever|infection|sick)/i,
    /kidney disease.*(potassium|phosphorus|protein supplement)/i,
    /(blood sugar|glucose).*(over 300|above 300|very high|under 70|below 70)/i,
  ];

  // Check medical emergencies
  for (const pattern of medicalEmergencyPatterns) {
    if (pattern.test(content)) {
      return {
        isEmergency: true,
        emergencyType: "medical",
        urgencyLevel: "immediate-911",
      };
    }
  }

  for (const pattern of heartAttackEmergencyPatterns) {
    if (pattern.test(content)) {
      return {
        isEmergency: true,
        emergencyType: "medical",
        urgencyLevel: "immediate-911",
      };
    }
  }

  // Check mental health crisis
  for (const pattern of mentalHealthCrisisPatterns) {
    if (pattern.test(content)) {
      return {
        isEmergency: true,
        emergencyType: "mental-health-crisis",
        urgencyLevel: "immediate-911",
      };
    }
  }

  // Check medication dangers
  for (const pattern of medicationDangerPatterns) {
    if (pattern.test(content)) {
      return {
        isEmergency: true,
        emergencyType: "medication-danger",
        urgencyLevel: "urgent-same-day",
      };
    }
  }

  // Check high-risk combinations
  for (const pattern of highRiskCombinationPatterns) {
    if (pattern.test(content)) {
      return {
        isEmergency: true,
        emergencyType: "high-risk-combination",
        urgencyLevel: "prompt-clinician-review",
      };
    }
  }

  return {
    isEmergency: false,
    emergencyType: null,
    urgencyLevel: null,
  };
}

// Generate emergency response
function generateEmergencyResponse(emergencyInfo) {
  const { emergencyType, urgencyLevel } = emergencyInfo;

  let response = "🚨 **EMERGENCY ALERT** 🚨\n\n";

  if (urgencyLevel === "immediate-911") {
    if (emergencyType === "medical") {
      response += `**This is a medical emergency. Do not use this chatbot for emergency care.**\n\n`;
      response += `**CALL 911 IMMEDIATELY** (or 999 in UK, 112 in EU) if you or someone near you is experiencing:\n`;
      response += `- Chest pain, pressure, or difficulty breathing\n`;
      response += `- Stroke symptoms (face drooping, arm weakness, speech difficulty)\n`;
      response += `- Severe bleeding or loss of consciousness\n`;
      response += `- Anaphylaxis (throat/face swelling with breathing difficulty)\n\n`;
      response += `**While waiting for emergency services:**\n`;
      response += `1. Stay calm and sit or lie down\n`;
      response += `2. If unconscious and trained, perform CPR\n`;
      response += `3. Do not eat or drink anything\n`;
      response += `4. Have your medications list ready for paramedics\n\n`;
    } else if (emergencyType === "mental-health-crisis") {
      response += `**This is a mental health crisis. Please reach out for immediate support:**\n\n`;
      response += `**🇺🇸 United States:**\n`;
      response += `- **988 Suicide & Crisis Lifeline**: Call or text 988 (24/7)\n`;
      response += `- **Crisis Text Line**: Text "HELLO" to 741741\n\n`;
      response += `**🇬🇧 United Kingdom:**\n`;
      response += `- **Samaritans**: Call 116 123 (24/7)\n`;
      response += `- **Shout**: Text "SHOUT" to 85258\n\n`;
      response += `**🇪🇺 European Union:**\n`;
      response += `- **Befrienders Worldwide**: Visit befrienders.org for your country\n\n`;
      response += `**If in immediate danger, call emergency services (911/999/112).**\n\n`;
      response += `You are not alone. Crisis counselors are available right now to help you through this.\n\n`;
    }
  } else if (urgencyLevel === "urgent-same-day") {
    response += `**This requires urgent medical attention today.**\n\n`;
    if (emergencyType === "medication-danger") {
      response += `⚠️ **Stopping or replacing prescribed medications without medical guidance can be dangerous.**\n\n`;
      response += `**Please contact your healthcare provider TODAY:**\n`;
      response += `1. Call your doctor's office immediately\n`;
      response += `2. Explain what medication you stopped or changed\n`;
      response += `3. If unable to reach your doctor, go to urgent care or ER\n\n`;
      response += `**Do NOT:**\n`;
      response += `- Stop blood pressure, diabetes, heart, or psychiatric medications abruptly\n`;
      response += `- Replace prescription medicines with supplements without supervision\n`;
      response += `- Wait to see if you feel okay - some effects are delayed\n\n`;
    }
  } else if (urgencyLevel === "prompt-clinician-review") {
    response += `**⚠️ This combination requires professional medical review.**\n\n`;
    response += `**Contact your healthcare provider within 24-48 hours to discuss:**\n`;
    response += `- Potential interactions between medications and supplements\n`;
    response += `- Safety monitoring for your specific health conditions\n`;
    response += `- Appropriate next steps\n\n`;
    response += `**In the meantime:**\n`;
    response += `- Do not start new supplements without approval\n`;
    response += `- Monitor for unusual symptoms\n`;
    response += `- Keep a list of all medications and supplements you're taking\n\n`;
  }

  response += `**This chatbot is for educational purposes only and cannot provide emergency or medical care.**\n\n`;
  response += `Please seek appropriate professional help immediately.`;

  return response;
}

// ═══════════════════════════════════════════════════════════════════════════
// FHIR-COMPATIBLE DATA STRUCTURES (HL7 FHIR R4)
// ═══════════════════════════════════════════════════════════════════════════

// Convert user profile to FHIR Patient resource structure
function toFHIRPatient(profile) {
  if (!profile) return null;

  return {
    resourceType: "Patient",
    id: "user-" + Date.now(),
    meta: {
      versionId: "1",
      lastUpdated: new Date().toISOString(),
    },
    identifier: [
      {
        system: "urn:health-chatbot:patient-id",
        value: `patient-${Date.now()}`,
      },
    ],
    extension: [
      {
        url: "http://hl7.org/fhir/StructureDefinition/patient-preferredLanguage",
        valueCodeableConcept: {
          coding: [
            {
              system: "urn:ietf:bcp:47",
              code: "en-US",
              display: "English (United States)",
            },
          ],
        },
      },
    ],
    // Age band as extension (not standard birth date for privacy)
    ...(profile.ageBand && {
      extension: [
        {
          url: "http://health-chatbot.example.org/fhir/StructureDefinition/age-band",
          valueString: profile.ageBand,
        },
      ],
    }),
  };
}

// Convert conditions to FHIR Condition resources
function toFHIRConditions(conditions) {
  if (!conditions || conditions.length === 0) return [];

  return conditions
    .filter((c) => c !== "None")
    .map((condition, idx) => ({
      resourceType: "Condition",
      id: `condition-${idx}`,
      meta: {
        lastUpdated: new Date().toISOString(),
      },
      clinicalStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
            code: "active",
            display: "Active",
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system:
              "http://terminology.hl7.org/CodeSystem/condition-ver-status",
            code: "unconfirmed",
            display: "Unconfirmed",
          },
        ],
        text: "Patient-reported",
      },
      category: [
        {
          coding: [
            {
              system:
                "http://terminology.hl7.org/CodeSystem/condition-category",
              code: "problem-list-item",
              display: "Problem List Item",
            },
          ],
        },
      ],
      code: {
        text: condition,
      },
      subject: {
        reference: "Patient/user-" + Date.now(),
        display: "Patient",
      },
      recordedDate: new Date().toISOString(),
    }));
}

// Convert medications to FHIR MedicationStatement resources
function toFHIRMedications(medicationsString) {
  if (!medicationsString || !medicationsString.trim()) return [];

  const medications = medicationsString
    .split(",")
    .map((m) => m.trim())
    .filter((m) => m);

  return medications.map((med, idx) => ({
    resourceType: "MedicationStatement",
    id: `medication-${idx}`,
    meta: {
      lastUpdated: new Date().toISOString(),
    },
    status: "active",
    medicationCodeableConcept: {
      text: med,
    },
    subject: {
      reference: "Patient/user-" + Date.now(),
      display: "Patient",
    },
    effectiveDateTime: new Date().toISOString(),
    dateAsserted: new Date().toISOString(),
    informationSource: {
      display: "Patient",
    },
  }));
}

// Convert allergies to FHIR AllergyIntolerance resources
function toFHIRAllergies(allergiesString) {
  if (!allergiesString || !allergiesString.trim()) return [];

  const allergies = allergiesString
    .split(",")
    .map((a) => a.trim())
    .filter((a) => a);

  return allergies.map((allergy, idx) => ({
    resourceType: "AllergyIntolerance",
    id: `allergy-${idx}`,
    meta: {
      lastUpdated: new Date().toISOString(),
    },
    clinicalStatus: {
      coding: [
        {
          system:
            "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
          code: "active",
          display: "Active",
        },
      ],
    },
    verificationStatus: {
      coding: [
        {
          system:
            "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
          code: "unconfirmed",
          display: "Unconfirmed",
        },
      ],
      text: "Patient-reported",
    },
    type: "allergy",
    category: ["food"],
    criticality: "low",
    code: {
      text: allergy,
    },
    patient: {
      reference: "Patient/user-" + Date.now(),
      display: "Patient",
    },
    recordedDate: new Date().toISOString(),
  }));
}

// Convert goals to FHIR Goal resources
function toFHIRGoals(goals) {
  if (!goals || goals.length === 0) return [];

  return goals.map((goal, idx) => ({
    resourceType: "Goal",
    id: `goal-${idx}`,
    meta: {
      lastUpdated: new Date().toISOString(),
    },
    lifecycleStatus: "active",
    achievementStatus: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/goal-achievement",
          code: "in-progress",
          display: "In Progress",
        },
      ],
    },
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/goal-category",
            code: "behavioral",
            display: "Behavioral",
          },
        ],
      },
    ],
    description: {
      text: goal,
    },
    subject: {
      reference: "Patient/user-" + Date.now(),
      display: "Patient",
    },
    startDate: new Date().toISOString().split("T")[0],
  }));
}

// Convert plan to FHIR CarePlan
function toFHIRCarePlan(planText, profile) {
  return {
    resourceType: "CarePlan",
    id: "careplan-" + Date.now(),
    meta: {
      lastUpdated: new Date().toISOString(),
    },
    status: "active",
    intent: "plan",
    category: [
      {
        coding: [
          {
            system: "http://hl7.org/fhir/us/core/CodeSystem/careplan-category",
            code: "assess-plan",
            display: "Assessment and Plan of Treatment",
          },
        ],
      },
    ],
    title: "Self-Management Care Plan",
    description: planText,
    subject: {
      reference: "Patient/user-" + Date.now(),
      display: "Patient",
    },
    created: new Date().toISOString(),
    author: {
      display: "Health Chatbot - Evidence-Based Health Coach",
    },
    ...(profile?.conditions &&
      profile.conditions.length > 0 && {
        addresses: profile.conditions
          .filter((c) => c !== "None")
          .map((condition) => ({
            reference: {
              display: condition,
            },
          })),
      }),
  };
}

// Create complete FHIR Bundle with all resources
function toFHIRBundle(profile, conversationSummary) {
  const resources = [];

  // Add Patient resource
  const patient = toFHIRPatient(profile);
  if (patient) resources.push(patient);

  // Add Condition resources
  if (profile?.conditions) {
    resources.push(...toFHIRConditions(profile.conditions));
  }

  // Add MedicationStatement resources
  if (profile?.medications) {
    resources.push(...toFHIRMedications(profile.medications));
  }

  // Add AllergyIntolerance resources
  if (profile?.allergies) {
    resources.push(...toFHIRAllergies(profile.allergies));
  }

  // Add Goal resources
  if (profile?.goals) {
    resources.push(...toFHIRGoals(profile.goals));
  }

  // Add CarePlan if conversation summary provided
  if (conversationSummary) {
    resources.push(toFHIRCarePlan(conversationSummary, profile));
  }

  return {
    resourceType: "Bundle",
    id: "bundle-" + Date.now(),
    meta: {
      lastUpdated: new Date().toISOString(),
    },
    type: "collection",
    timestamp: new Date().toISOString(),
    entry: resources.map((resource) => ({
      fullUrl: `urn:uuid:${resource.resourceType}-${resource.id}`,
      resource: resource,
    })),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// USAGE TRACKING & AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════

const MONTHLY_LIMITS = {
  free: 25,
  pro: 100,
  premium: 500,
};
const FULL_ACCESS_MONTHLY_LIMIT = 999999;

// Helper to extract user from JWT token
async function getUserFromToken(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !supabaseAdmin) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return user;
}

// Check and enforce usage limits
async function checkUsageLimit(userId) {
  if (!supabaseAdmin) return { allowed: true, count: 0, limit: Infinity, tier: "unknown" };

  try {
    // Get user's subscription tier
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, subscription_tier")
      .eq("id", userId)
      .single();

    const tier = getEffectiveSubscriptionTier(null, profile);
    const limit = hasFullAccess(null, profile)
      ? FULL_ACCESS_MONTHLY_LIMIT
      : MONTHLY_LIMITS[tier];

    // Get current month's usage
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const resetDate = firstOfMonth.toISOString().split("T")[0];

    const { data: usage } = await supabaseAdmin
      .from("usage_tracking")
      .select("usage_count")
      .eq("user_id", userId)
      .eq("feature", "health_chat")
      .eq("reset_date", resetDate)
      .single();

    const currentCount = usage?.usage_count || 0;

    return {
      allowed: currentCount < limit,
      count: currentCount,
      limit,
      tier,
    };
  } catch (error) {
    console.error("Error checking usage limit:", error);
    return { allowed: true, count: 0, limit: Infinity, tier: "unknown" };
  }
}

// Increment usage count
async function incrementUsage(userId) {
  if (!supabaseAdmin) return;

  try {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const resetDate = firstOfMonth.toISOString().split("T")[0];

    // Get current count
    const { data: existing } = await supabaseAdmin
      .from("usage_tracking")
      .select("usage_count")
      .eq("user_id", userId)
      .eq("feature", "health_chat")
      .eq("reset_date", resetDate)
      .single();

    const newCount = (existing?.usage_count || 0) + 1;

    // Upsert the usage count
    await supabaseAdmin
      .from("usage_tracking")
      .upsert({
        user_id: userId,
        feature: "health_chat",
        usage_count: newCount,
        reset_date: resetDate,
      }, { onConflict: "user_id,feature,reset_date" });

  } catch (error) {
    console.error("Error incrementing usage:", error);
  }
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let user = null;
  let usageInfo = null;

  try {
    const { messages, knowledgeContext, profileContext } = req.body;

    // Validate input
    const validation = validateInput(messages);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Check for prompt injection
    if (detectPromptInjection(messages)) {
      return res.status(400).json({
        error: "Invalid request: potential security issue detected",
      });
    }

    // Check for emergency or crisis in the latest user message
    const latestUserMessage = messages[messages.length - 1];
    if (latestUserMessage && latestUserMessage.role === "user") {
      const emergencyInfo = detectEmergencyOrCrisis(latestUserMessage.content);

      if (emergencyInfo.isEmergency) {
        // Return emergency response immediately without calling an AI provider.
        const emergencyResponse = generateEmergencyResponse(emergencyInfo);

        // Set headers for streaming (to match expected format)
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");

        // Send the emergency response as a stream
        res.write(
          `data: ${JSON.stringify({ content: emergencyResponse })}\n\n`,
        );
        res.write("data: [DONE]\n\n");
        return res.end();
      }
    }

    if (requireAuth && !supabaseAdmin) {
      return res.status(500).json({
        error: "Authentication database is not configured",
      });
    }

    // Health conversations can contain sensitive data, so auth is required by default.
    user = await getUserFromToken(req);

    if (requireAuth && !user) {
      return res.status(401).json({
        error: "Please sign in to use the health chatbot.",
      });
    }
    
    // If user is authenticated, check usage limits
    if (user) {
      usageInfo = await checkUsageLimit(user.id);
      
      if (!usageInfo.allowed) {
        return res.status(429).json({
          error: `Monthly limit reached (${usageInfo.count}/${usageInfo.limit} messages used). Please upgrade to continue.`,
          usage: usageInfo,
        });
      }
    }

    // Prepend system message
    const messagesToSend = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (profileContext && typeof profileContext === "string") {
      messagesToSend.push({
        role: "system",
        content: `USER HEALTH PROFILE CONTEXT:\n${profileContext.substring(0, 2000)}\nUse this as patient-reported context only. Do not treat it as a clinical diagnosis.`,
      });
    }

    // If knowledge context provided, add it as additional system message
    if (knowledgeContext && knowledgeContext.length > 0) {
      const kbContent = "📚 RELEVANT CONTEXT FROM YOUR HEALTH HISTORY:\n\n" +
        knowledgeContext.map(kb => {
          const citation = kb.content_type === "document_chunk"
            ? `Source: ${kb.metadata?.title || kb.title || "Uploaded document"}${kb.metadata?.chapter ? `, ${kb.metadata.chapter}` : ""}${kb.metadata?.page_start ? `, page ${kb.metadata.page_start}` : ""}`
            : "Source: prior health history";
          const category = kb.metadata?.category ? ` Category: ${kb.metadata.category}.` : "";
          const sourceType = kb.metadata?.source === "books-folder" || kb.metadata?.source === "dashboard-upload"
            ? `Book library context.${category} Use as supporting context with evidence and safety checks.`
            : "";
          return `[${kb.content_type}] ${citation}${sourceType ? `\n${sourceType}` : ""}\n${kb.content.substring(0, 700)}${kb.content.length > 700 ? '...' : ''}`;
        }).join("\n\n") +
        "\n\nUse the above context to provide personalized, continuous care. Reference past discussions where relevant and cite uploaded documents/books when used. For naturopathy/natural-health books, separate the book perspective from scientific/standard-care guidance, evidence level, and safety cautions. For bodybuilding and yoga books, adapt training guidance conservatively to the user's health profile and injury risk. If book context conflicts with established evidence or safety guidance, prioritize safety and established care.";
      
      messagesToSend.push({ role: "system", content: kbContent });
    }

    // Add user messages
    messagesToSend.push(...messages);

    // Set headers for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    await streamHealthChat(messagesToSend, res, {
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Increment usage count for authenticated users
    if (user) {
      await incrementUsage(user.id);
    }

    // End the stream
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
      console.error("Health chat API error:", error?.status || error?.statusCode || "no-status", error?.message || error);
      // Log response body if available (OpenAI client errors often include response)
      try {
        if (error?.response) {
          console.error("Health chat API error response:", JSON.stringify(error.response));
        }
      } catch (e) {
        // ignore logging errors
      }

    if (
      error.message === "OpenAI API key is not configured" ||
      error.message?.startsWith("Ollama chat request failed") ||
      error.message?.startsWith("Unsupported health AI provider")
    ) {
      return res.status(500).json({
        error: "AI provider is not configured",
        detail: process.env.NODE_ENV !== "production"
          ? `${error.message}. ${getHealthAiConfigurationHint()}`
          : undefined,
      });
    }

    if (error.status === 429) {
      // Provide a bit more detail in development to help debugging
      const devDetail = process.env.NODE_ENV !== "production" ? (error.message || error.toString()) : undefined;
      return res.status(429).json({
        error: "Too many requests. Please try again in a moment.",
        detail: devDetail,
      });
    }

    const devMsg = process.env.NODE_ENV !== "production" ? (error.message || String(error)) : undefined;
    res.status(500).json({
      error: "An error occurred processing your request",
      detail: devMsg,
    });
  }
}
