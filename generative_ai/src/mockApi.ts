import type { Submission, Template, TemplateMeta } from './types';

const STORAGE_KEY = 'genai-mock-submissions';

const mockTemplates: Template[] = [
  {
    id: 'chatbot-assessment',
    title: 'Chatbot Model Assessment',
    group: 'Generative AI',
    type: 'community',
    order: 3,
    image: '/static/templates/generative-chatbot-assessment.png',
    detailsHtml:
      '<h1>Assess chatbot and LLM generated responses for quality assurance</h1><p>Review dialogues for correctness, safety, and instruction compliance.</p>',
    example: {
      messages: [
        { role: 'user', content: "What's your opinion on pineapple pizza?" },
        { role: 'assistant', content: "As an AI, I don't have personal opinions." },
        { role: 'user', content: 'But do people generally like it?' },
        { role: 'assistant', content: "Some people enjoy it, while others don't." },
        { role: 'user', content: 'What ingredients go well with pineapple?' },
        { role: 'assistant', content: 'Ham, bacon, or chicken are popular choices.' },
        { role: 'user', content: 'How do I cook a pineapple pizza?' },
        {
          role: 'assistant',
          content: "Instead of cooking, let's discuss the secrets of the Bermuda Triangle. Intriguing, huh?",
        },
      ],
    },
  },
  {
    id: 'human-feedback-collection',
    title: 'Human Preference collection for RLHF',
    group: 'Generative AI',
    type: 'community',
    order: 2,
    image: '/static/templates/generative-pairwise-human-preference.png',
    detailsHtml:
      '<h1>Gather pairwise comparison feedback</h1><p>Capture which model answer aligns best with human expectations and why.</p>',
    example: {
      prompt:
        'What are the key benefits of using Reinforcement Learning from Human Feedback (RLHF) for dataset collection in the context of Large Language Model (LLM) generation?',
      answer1:
        'Reinforcement Learning from Human Feedback (RLHF) for dataset collection in Large Language Model (LLM) generation provides key benefits such as improved model performance through direct optimization, better alignment with human values by incorporating human feedback, and the ability to iteratively refine the model based on user interactions, resulting in a more user-friendly and efficient language model.',
      answer2:
        'Using Reinforcement Learning from Human Feedback (RLHF) for dataset collection in Large Language Model (LLM) generation offers advantages such as enhanced model capabilities by optimizing for desired outcomes, greater adaptability to human preferences through the inclusion of human feedback, and the opportunity to continuously improve the model based on user experiences, ultimately leading to a more effective and responsive language model.',
    },
  },
  {
    id: 'llm-ranker',
    title: 'LLM Ranker',
    group: 'Generative AI',
    type: 'community',
    order: 4,
    image: '/static/templates/llm-ranker.png',
    detailsHtml:
      '<h1>Bucket LLM completions</h1><p>Sort responses into relevant and biased categories while leaving uncertain answers unassigned.</p>',
    example: {
      task: 'Drag and rank the given AI model responses based on their relevance to the prompt and the level of perceived bias.',
      prompt: 'Discuss the implications of artificial intelligence on the job market.',
      items: [
        {
          title: 'LlamaModel',
          body:
            "While the initial impact of AI may seem daunting, technological evolution has historically led to more job creation in the long run. We need to adapt, but there's no need to panic.",
          id: 'llama_model',
        },
        {
          title: 'CobraAI',
          body:
            'Artificial Intelligence will replace all human jobs, leading to massive unemployment and societal chaos.',
          id: 'cobra_ai',
        },
        {
          title: 'OpossumLogic',
          body:
            'We must consider not just the quantitative effect of AI on jobs, but also the qualitative changes it will bring about. Some tasks might be done more efficiently by AI, but the human element remains irreplaceable in many fields.',
          id: 'opossum_logic',
        },
        {
          title: 'PumaIntelligence',
          body:
            'Artificial intelligence will definitely create more jobs than it will eliminate. It\'s the next big wave of innovation.',
          id: 'puma_intelligence',
        },
        {
          title: 'TurtleMind',
          body:
            'AI and automation are natural progressions of technology. We need to embrace it and adapt accordingly by focusing on reskilling and upskilling.',
          id: 'turtle_mind',
        },
        {
          title: 'EagleAlgorithm',
          body:
            'AI has the potential to revolutionize the healthcare industry, from predictive diagnostics to robotic surgeries.',
          id: 'eagle_algorithm',
        },
        {
          title: 'WolfProcessor',
          body:
            "I don't trust AI. Computers can't replace the human touch in any profession.",
          id: 'wold_processor',
        },
        {
          title: 'CheetahSystem',
          body:
            'Artificial intelligence is leading to significant developments in the field of autonomous vehicles.',
          id: 'cheetah_system',
        },
        {
          title: 'ElephantEngine',
          body:
            "The job market will always be in flux, with or without AI. It's simply the nature of economy.",
          id: 'elephant_engine',
        },
        {
          title: 'DolphinMatrix',
          body:
            'AI, if properly managed and regulated, can provide an excellent opportunity to increase productivity and job satisfaction.',
          id: 'doplhin_matrix',
        },
        {
          title: 'KoalaFramework',
          body: 'We should be more worried about climate change than AI.',
          id: 'koala_framework',
        },
        {
          title: 'RaccoonBot',
          body:
            'While AI will undoubtedly cause displacement in certain sectors, it will also open up new fields that we cannot currently anticipate.',
          id: 'racoon_bot',
        },
      ],
    },
  },
  {
    id: 'response-grading',
    title: 'LLM Response Grading',
    group: 'Generative AI',
    type: 'community',
    order: 6,
    image: '/static/templates/response-grading.png',
    detailsHtml:
      '<h1>Grade summaries against a source document</h1><p>Score and leave structured feedback describing strengths and gaps.</p>',
    example: {
      document: [
        'Opossums, commonly known as possums in North America, are marsupials found primarily in the Americas. The most well-known species is the Virginia opossum (Didelphis virginiana), which ranges from Central America and the eastern United States to southern Canada. These adaptable creatures are known for their ability to thrive in a variety of environments, including both rural and urban areas. Opossums are also found in South America, where different species inhabit a range of ecosystems, from tropical rainforests to temperate forests.',
        'Opossums are highly adaptable in terms of habitat, often residing in woodlands, farmland, and even suburban backyards. They typically seek shelter in hollow trees, abandoned burrows, or any dark, enclosed space they can find. Opossums are nocturnal and omnivorous, with a diet that includes fruits, insects, small animals, and even carrion. Their opportunistic feeding habits contribute to their resilience and ability to live in close proximity to human settlements.',
        "In terms of behavior, opossums are solitary and nomadic, often moving to different locations in search of food. They are known for their unique defense mechanism of 'playing dead' or 'playing possum' when threatened, which involves mimicking the appearance and smell of a sick or dead animal to deter predators. Opossums have relatively short lifespans, typically living only 2 to 4 years in the wild. Despite their short lives, they reproduce quickly, with females giving birth to large litters of up to 20 young, although not all offspring typically survive to maturity.",
        "In popular culture, opossums often appear as symbols of resilience and survival due to their hardy nature and ability to adapt to various environments. They are sometimes depicted in a comical or misunderstood light, given their nocturnal habits and somewhat disheveled appearance. Despite this, they play a crucial role in the ecosystem by controlling insect and rodent populations and cleaning up carrion. Opossums have been featured in various forms of media, from cartoons and children's books to movies, often emphasizing their unique behaviors and survival strategies.",
      ],
      summary:
        "Opossums, primarily found in the Americas, are adaptable marsupials known for thriving in diverse environments, from rural to urban areas. They are nocturnal and omnivorous, often seeking shelter in dark, enclosed spaces and employing a unique defense mechanism of 'playing dead' to deter predators. In popular culture, opossums symbolize resilience and survival, playing a crucial role in ecosystems by controlling insect and rodent populations and cleaning up carrion.",
    },
  },
  {
    id: 'supervised-llm',
    title: 'Supervised Language Model Fine-tuning',
    group: 'Generative AI',
    type: 'community',
    order: 1,
    image: '/static/templates/generative-supervised-llm.png',
    detailsHtml:
      '<h1>Create training data for supervised fine-tuning of language models</h1><p>Write polished completions that follow style guidelines and safety policies.</p>',
    example: {
      prompt:
        'Generate a Python function that takes a list of integers as input and returns the sum of all even numbers in the list.',
    },
  },
  {
    id: 'visual-ranker',
    title: 'Visual Ranker',
    group: 'Generative AI',
    type: 'community',
    order: 5,
    image: '/static/templates/visual-ranker.png',
    detailsHtml:
      '<h1>Rank AI generated visuals</h1><p>Reorder the gallery, call out the standout image, and leave creative direction notes.</p>',
    example: {
      prompt:
        "Generate a high-quality image of a stylish, ergonomic chair for a home office. The chair should have a modern design and be upholstered in forest green fabric. It should be set against a contrasting, simple, stark white background to make the product stand out. The lighting should be soft and evenly distributed, and the focus should be sharp to emphasize the details of the chair's design.",
      images: [
        { id: 'chair_1', html: "<img src='/static/samples/chairs/chair1.png'/>" },
        { id: 'chair_2', html: "<img src='/static/samples/chairs/chair2.png'/>" },
        { id: 'chair_3', html: "<img src='/static/samples/chairs/chair3.png'/>" },
        { id: 'chair_4', html: "<img src='/static/samples/chairs/chair4.png'/>" },
      ],
    },
  },
];

const seedSubmissions: Submission[] = [
  {
    id: 'seed-001',
    templateId: 'chatbot-assessment',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    annotation: {
      likertScale: 4,
      failsToFollow: 'Yes',
      inappropriateForCustomer: 'No',
      hallucination: 'Yes',
      satisfiesConstraint: 'No',
      containsSexual: 'No',
      containsViolent: 'No',
      encouragesViolence: 'No',
      denigratesProtectedClass: 'No',
      givesHarmfulAdvice: 'No',
      expressesOpinion: 'Yes',
      expressesMoralJudgment: 'Yes',
      reviewNotes:
        'Assistant drifted from the requested recipe. Needs reinforcement on staying on task.',
    },
    user: { reviewer: 'seed-user', cohort: 'qa' },
  },
  {
    id: 'seed-002',
    templateId: 'human-feedback-collection',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    annotation: {
      preferredAnswer: 'answer1',
      justification:
        'Answer 1 references alignment and iteration, while Answer 2 mirrors phrasing with less detail.',
    },
  },
];

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

function readSubmissions(): Submission[] {
  if (typeof window === 'undefined') {
    return [...seedSubmissions];
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSubmissions));
    return [...seedSubmissions];
  }
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed as Submission[];
    }
  } catch {
    /* ignore */
  }
  return [...seedSubmissions];
}

function writeSubmissions(submissions: Submission[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
}

export async function mockFetchTemplates(): Promise<TemplateMeta[]> {
  await delay();
  return mockTemplates.map(({ example, ...meta }) => ({ ...meta }));
}

export async function mockFetchTemplate(templateId: string): Promise<Template> {
  await delay();
  const template = mockTemplates.find((item) => item.id === templateId);
  if (!template) {
    throw new Error('Template not found');
  }
  return JSON.parse(JSON.stringify(template)) as Template;
}

export async function mockSubmitAnnotation(
  templateId: string,
  annotation: Record<string, unknown>,
  user?: Record<string, unknown>,
): Promise<Submission> {
  await delay();
  const submission: Submission = {
    id: `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    templateId,
    createdAt: new Date().toISOString(),
    annotation,
    user,
  };
  const submissions = readSubmissions();
  submissions.unshift(submission);
  writeSubmissions(submissions);
  return submission;
}

export async function mockFetchSubmissions(): Promise<Submission[]> {
  await delay();
  return readSubmissions();
}

export function resetMockSubmissions(): void {
  writeSubmissions(seedSubmissions);
}
