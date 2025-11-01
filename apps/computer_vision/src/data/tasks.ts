import type { BaseTaskDefinition } from '../types/tasks';

export const tasks: BaseTaskDefinition[] = [
  {
    id: 'image-captioning',
    title: 'Image Captioning',
    type: 'community',
    group: 'Computer Vision',
    image: 'https://images.unsplash.com/photo-1526312426976-f4d754fa9bd6?auto=format&fit=crop&w=1200&q=80',
    order: 1,
    details: `
      <h1>Write text describing the image</h1>
      <dl>
        <dt>Industry Applications</dt>
        <dd>accessibility tools, visual search engines, content management systems, social media automation, e-commerce product descriptions, news media, digital asset management, museum cataloging, educational content, medical imaging reports, surveillance systems, autonomous systems</dd>
        <dt>Associated Models</dt>
        <dd>BLIP, Show and Tell, Attention-based models, Vision Transformer, CLIP, GPT-4V</dd>
        <dt>Domain Terminology</dt>
        <dd>visual-to-text, image-to-text, visual storytelling, scene understanding, visual description</dd>
      </dl>
    `,
    schema: {
      kind: 'image_captioning',
      image:
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      prompt: 'Describe what is happening in this scene.'
    }
  },
  {
    id: 'image-classification',
    title: 'Image Classification',
    type: 'community',
    group: 'Computer Vision',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    order: 2,
    details: `
      <h1>Classify the image</h1>
      <dl>
        <dt>Industry Applications</dt>
        <dd>content moderation, safety detection, inappropriate content, nsfw detection, social media moderation, platform safety, community guidelines</dd>
        <dt>Associated Models</dt>
        <dd>ResNet, EfficientNet, Vision Transformer, CNN, ConvNet</dd>
        <dt>Domain Terminology</dt>
        <dd>image tagging, visual categorization, multi-class, single-label</dd>
      </dl>
    `,
    schema: {
      kind: 'image_classification',
      image:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      multiple: false,
      choices: ['Adult content', 'Weapons', 'Violence', 'Safe content']
    }
  },
  {
    id: 'visual-question-answering',
    title: 'Visual Question Answering',
    type: 'community',
    group: 'Computer Vision',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    order: 3,
    details: `
      <h1>Answer the questions related to what you see on the picture</h1>
      <dl>
        <dt>Industry Applications</dt>
        <dd>accessibility tools, educational assessment, autonomous systems, robotics navigation, medical image analysis, surveillance intelligence, content moderation, e-commerce search, museum guide systems, smart home automation, industrial quality control, retail analytics</dd>
        <dt>Associated Models</dt>
        <dd>ViLBERT, LXMERT, VisualBERT, UNITER, BLIP, GPT-4V, Flamingo</dd>
        <dt>Domain Terminology</dt>
        <dd>multimodal reasoning, visual reasoning, scene understanding, visual intelligence, cross-modal fusion</dd>
      </dl>
    `,
    schema: {
      kind: 'visual_question_answering',
      image:
        'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
      aspects: [
        'attribute identification',
        'counting',
        'comparison',
        'multiple attention',
        'logical operations'
      ],
      questions: [
        { id: 'q1', text: 'What is the person doing?' },
        { id: 'q2', text: 'How many cups can you see?' },
        { id: 'q3', text: 'Is the scene indoors or outdoors?' },
        { id: 'q4', text: 'What time of day might it be?' }
      ]
    }
  },
  {
    id: 'object-detection-with-bounding-boxes',
    title: 'Object Detection with Bounding Boxes',
    type: 'community',
    group: 'Computer Vision',
    image: 'https://images.unsplash.com/photo-1465447142348-e9952c393450?auto=format&fit=crop&w=1200&q=80',
    order: 4,
    details: `
      <h1>Draw a bounding box around the object</h1>
      <dl>
        <dt>Industry Applications</dt>
        <dd>autonomous driving, traffic monitoring, surveillance, retail analytics, inventory management, warehouse automation</dd>
        <dt>Associated Models</dt>
        <dd>YOLO, R-CNN, SSD, Faster R-CNN, RetinaNet, FCOS</dd>
        <dt>Domain Terminology</dt>
        <dd>bbox</dd>
      </dl>
    `,
    schema: {
      kind: 'object_detection',
      image:
        'https://images.unsplash.com/photo-1465447142348-e9952c393450?auto=format&fit=crop&w=1200&q=80',
      labels: ['Car', 'Pedestrian', 'Bicycle']
    }
  },
  {
    id: 'semantic-segmentation-with-polygons',
    title: 'Semantic Segmentation with Polygons',
    type: 'community',
    group: 'Computer Vision',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
    order: 5,
    details: `
      <h1>Draw a polygon around object</h1>
      <dl>
        <dt>Industry Applications</dt>
        <dd>autonomous driving, medical image analysis, satellite imagery analysis, geospatial mapping, urban planning, precision agriculture</dd>
        <dt>Associated Models</dt>
        <dd>DeepLab, PSPNet, U-Net, SegNet, Mask R-CNN, FCN</dd>
        <dt>Domain Terminology</dt>
        <dd>polygon annotation, boundary detection, precise segmentation, contour detection</dd>
      </dl>
    `,
    schema: {
      kind: 'semantic_segmentation',
      image:
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
      labels: ['Tree line', 'Ground', 'Sky']
    }
  },
  {
    id: 'optical-character-recognition',
    title: 'Optical Character Recognition',
    type: 'community',
    group: 'Computer Vision',
    image: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1200&q=80',
    order: 6,
    details: `
      <h1>Draw a bounding box or polygon around region and write down the text found inside</h1>
      <dl>
        <dt>Industry Applications</dt>
        <dd>document digitization, invoice processing, receipt scanning, license plate recognition, banking automation, insurance claims, form processing</dd>
        <dt>Associated Models</dt>
        <dd>Tesseract, PaddleOCR, EasyOCR, TrOCR, CRAFT, DBNet</dd>
        <dt>Domain Terminology</dt>
        <dd>text detection, text recognition, handwriting recognition, document understanding</dd>
      </dl>
    `,
    schema: {
      kind: 'ocr',
      image:
        'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
      labels: ['Text', 'Handwriting']
    }
  }
];
