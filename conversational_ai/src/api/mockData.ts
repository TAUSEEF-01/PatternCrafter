import type { Task, Template } from '../types'

export const mockTemplates: Template[] = [
  {
    id: 'coreference-resolution-and-entity-linking',
    title: 'Coreference Resolution & Entity Linking',
    type: 'community',
    group: 'Conversational AI',
    image: '/static/templates/coreference-resolution-and-entity-linking.png',
    details: '<h1>Do coreference resolution between parts of speech and link entities in text</h1>',
    config: `<View>
  <Labels name="label" toName="text">
    <Label value="Noun" background="red"/>
    <Label value="Pronoun" background="darkorange"/>
  </Labels>

  <Text name="text" value="$corefText"/>
</View>
`,
  },
  {
    id: 'intent-classification-and-slot-filling',
    title: 'Intent Classification and Slot Filling',
    type: 'community',
    group: 'Conversational AI',
    image: '/static/templates/intent-classification-and-slot-filling.png',
    details: `<h1>Build a task-oriented dialogue system by selecting dialogue intents and extracting slot entities</h1>
<dl>
  <dt>Industry Applications</dt>
  <dd>chatbots, virtual assistants, customer service automation, voice assistants, smart speakers, IVR systems, booking systems, e-commerce assistants, banking chatbots, healthcare assistants, travel booking, restaurant reservations</dd>
  <dt>Associated Models</dt>
  <dd>natural language understanding, joint training, BERT-based models, multi-task learning</dd>
  <dt>Domain Terminology</dt>
  <dd>NLP, NLU, slot extraction, intent recognition, dialogue systems, task-oriented conversation</dd>
</dl>`,
    config: `<View>
  <ParagraphLabels name="entity_slot" toName="dialogue">
    <Label value="Person" />
    <Label value="Organization" />
    <Label value="Location" />
    <Label value="Datetime" />
    <Label value="Quantity" />
  </ParagraphLabels>
  <Paragraphs name="dialogue" value="$humanMachineDialogue" layout="dialogue" />
    <Choices name="intent" toName="dialogue"
         choice="single" showInLine="true">
        <Choice value="Greeting"/>
        <Choice value="Customer request"/>
        <Choice value="Small talk"/>
    </Choices>
</View>
`,
  },
  {
    id: 'response-generation',
    title: 'Response Generation',
    type: 'community',
    group: 'Conversational AI',
    image: '/static/templates/response-generation.png',
    details: '<h1>Collect chatbot training data by generating next dialogue response</h1>',
    config: `<View>
  <Paragraphs name="chat" value="$dialogue" layout="dialogue" />
  <Header value="Provide response" />
  <TextArea name="response" toName="chat" rows="4" editable="true" maxSubmissions="1" />
</View>
`,
  },
  {
    id: 'response-selection',
    title: 'Response Selection',
    type: 'community',
    group: 'Conversational AI',
    image: '/static/templates/response-selection.png',
    details: '<h1>Collect chatbot training data by selecting next dialogue response</h1>',
    config: `<View>
  <Paragraphs name="prg" value="$humanMachineDialogue" layout="dialogue" />
  <Header value="Choose response" />
  <View style="display: flex;">
    <View>
    <Text name="resp1" value="$respone" />
    <Text name="resp2" value="$resptwo" />
    <Text name="resp3" value="$respthree" />
    </View>
    <View style="padding: 50px;">
    <Choices name="resp" toName="prg" required="true">
      <Choice value="One" />
      <Choice value="Two" />
      <Choice value="Three" />
    </Choices>
    </View>
  </View>
</View>
`,
  },
]

export const mockTasks: Task[] = [
  {
    id: 'coref-1',
    templateId: 'coreference-resolution-and-entity-linking',
    payload: {
      corefText:
        'Alice and Bob visited the museum before they met Carol. Later, she invited them to dinner at her apartment.',
    },
  },
  {
    id: 'coref-2',
    templateId: 'coreference-resolution-and-entity-linking',
    payload: {
      corefText:
        'When the engineer reviewed the report, he realized it referenced outdated specifications, so he scheduled a follow-up meeting.',
    },
  },
  {
    id: 'intent-1',
    templateId: 'intent-classification-and-slot-filling',
    payload: {
      humanMachineDialogue: [
        { speaker: 'Customer', text: "Hi there! I'd like to book a table for two tonight." },
        { speaker: 'Assistant', text: 'Sure thing. Could I have your name and a time?' },
        { speaker: 'Customer', text: "It's for Sam Lee at 7 PM." },
      ],
    },
  },
  {
    id: 'intent-2',
    templateId: 'intent-classification-and-slot-filling',
    payload: {
      humanMachineDialogue: [
        { speaker: 'Traveler', text: 'Hello, can you help me find the gate for flight AZ204?' },
        { speaker: 'Agent', text: 'Absolutely. May I have your destination city?' },
        { speaker: 'Traveler', text: "I'm heading to Rome." },
      ],
    },
  },
  {
    id: 'response-generation-1',
    templateId: 'response-generation',
    payload: {
      dialogue: [
        { speaker: 'Rider', text: 'My train is delayed. Can you check when the next one leaves?' },
        { speaker: 'Agent', text: 'I can help with that. What is your destination?' },
        { speaker: 'Rider', text: "I'm heading to Central Station." },
      ],
    },
  },
  {
    id: 'response-generation-2',
    templateId: 'response-generation',
    payload: {
      dialogue: [
        { speaker: 'User', text: 'The printer keeps jamming whenever I try to print a PDF.' },
        { speaker: 'Support', text: 'Thanks for letting me know. Does it happen with color prints or black and white?' },
        { speaker: 'User', text: 'It happens with both.' },
      ],
    },
  },
  {
    id: 'response-selection-1',
    templateId: 'response-selection',
    payload: {
      humanMachineDialogue: [
        { speaker: 'User', text: 'Hey, do you know if the cafe is open right now?' },
        { speaker: 'Assistant', text: 'Let me check their hours for you. One moment.' },
      ],
      responseOptions: [
        "They're open until 6 PM today. Would you like the address?",
        "I don't know. Maybe call them yourself.",
        'Cafes usually stay open late, so yes.',
      ],
    },
  },
  {
    id: 'response-selection-2',
    templateId: 'response-selection',
    payload: {
      humanMachineDialogue: [
        { speaker: 'Customer', text: 'Can you recommend a movie similar to Inception?' },
        { speaker: 'Assistant', text: 'Absolutely. Do you prefer fast-paced or more character-driven stories?' },
      ],
      responseOptions: [
        'If you liked Inception, you might enjoy Tenet for its mind-bending plot.',
        'Just rewatch Inception again and again.',
        'Cartoons are better than action movies.',
      ],
    },
  },
]
