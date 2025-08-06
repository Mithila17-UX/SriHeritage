{\rtf1\ansi\ansicpg1252\cocoartf2639
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fnil\fcharset0 HelveticaNeue-Medium;\f1\fnil\fcharset0 HelveticaNeue;\f2\fnil\fcharset0 .AppleSystemUIFontMonospaced-Regular;
}
{\colortbl;\red255\green255\blue255;\red236\green244\blue251;\red1\green5\blue10;\red0\green0\blue0;
}
{\*\expandedcolortbl;;\cssrgb\c94118\c96471\c98824;\cssrgb\c392\c1569\c3529;\cssrgb\c0\c0\c0;
}
{\*\listtable{\list\listtemplateid1\listhybrid{\listlevel\levelnfc0\levelnfcn0\leveljc0\leveljcn0\levelfollow0\levelstartat1\levelspace360\levelindent0{\*\levelmarker \{decimal\}}{\leveltext\leveltemplateid1\'01\'00;}{\levelnumbers\'01;}\fi-360\li720\lin720 }{\listname ;}\listid1}
{\list\listtemplateid2\listhybrid{\listlevel\levelnfc0\levelnfcn0\leveljc0\leveljcn0\levelfollow0\levelstartat3\levelspace360\levelindent0{\*\levelmarker \{decimal\}}{\leveltext\leveltemplateid101\'01\'00;}{\levelnumbers\'01;}\fi-360\li720\lin720 }{\listname ;}\listid2}}
{\*\listoverridetable{\listoverride\listid1\listoverridecount0\ls1}{\listoverride\listid2\listoverridecount0\ls2}}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab720
\pard\pardeftab720\partightenfactor0

\f0\b\fs32 \cf2 \cb3 \expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 2. Install dependencies\cb1 \
\pard\pardeftab720\partightenfactor0
{\field{\*\fldinst{HYPERLINK "https://github.com/marketplace/models/azureml-xai/grok-3#2-install-dependencies"}}{\fldrslt 
\f1\b0 \cf2 \
}}\pard\tx220\tx720\pardeftab720\li720\fi-720\partightenfactor0
\ls1\ilvl0
\f1\b0 \cf2 \cb3 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	1	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 Install\'a0{\field{\*\fldinst{HYPERLINK "https://nodejs.org/"}}{\fldrslt \ul Node.js}}.\cb1 \
\ls1\ilvl0\cb3 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	2	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 Copy the following lines of text and save them as a file\'a0
\f2\fs23\fsmilli11900 package.json
\f1\fs32 \'a0inside your folder.\cb1 \
\pard\pardeftab720\partightenfactor0

\f2 \cf2 \{\
  "type": "module",\
  "dependencies": \{\
    "@azure-rest/ai-inference": "latest",\
    "@azure/core-auth": "latest",\
    "@azure/core-sse": "latest"\
  \}\
\}\
\pard\pardeftab720\partightenfactor0

\f0\fs28 \cf2 \
\pard\pardeftab720\partightenfactor0

\f1\fs32 \cf2 \
\pard\pardeftab720\partightenfactor0
\cf0 \cb3 \strokec4 Note:\'a0
\f2\fs23\fsmilli11900 @azure/core-sse
\f1\fs32 \'a0is only needed when you stream the chat completions response.\cb1 \
\pard\tx220\tx720\pardeftab720\li720\fi-720\partightenfactor0
\ls2\ilvl0\cf2 \cb3 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	3	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 Open a terminal window in this folder and run\'a0
\f2\fs23\fsmilli11900 npm install
\f1\fs32 .\cb1 \
\ls2\ilvl0\cb3 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	4	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 For each of the code snippets below, copy the content into a file\'a0
\f2\fs23\fsmilli11900 sample.js
\f1\fs32 \'a0and run with\'a0
\f2\fs23\fsmilli11900 node sample.js
\f1\fs32 .\cb1 \
\pard\pardeftab720\partightenfactor0

\f0\b \cf2 \cb3 3. Run a basic code sample\cb1 \
\pard\pardeftab720\partightenfactor0
{\field{\*\fldinst{HYPERLINK "https://github.com/marketplace/models/azureml-xai/grok-3#3-run-a-basic-code-sample"}}{\fldrslt 
\f1\b0 \cf2 \
}}\pard\pardeftab720\partightenfactor0

\f1\b0\fs24 \cf2 \cb3 This sample demonstrates a basic call to the chat completion API. It is leveraging the GitHub AI model inference endpoint and your GitHub token. The call is synchronous.\
\pard\pardeftab720\partightenfactor0

\f2\fs32 \cf2 \cb1 import ModelClient, \{ isUnexpected \} from "@azure-rest/ai-inference";\
import \{ AzureKeyCredential \} from "@azure/core-auth";\
\
const token = process.env["GITHUB_TOKEN"];\
const endpoint = "https://models.github.ai/inference";\
const model = "xai/grok-3";\
\
export async function main() \{\
\
  const client = ModelClient(\
    endpoint,\
    new AzureKeyCredential(token),\
  );\
\
  const response = await client.path("/chat/completions").post(\{\
    body: \{\
      messages: [\
        \{ role:"system", content: "You are a helpful assistant." \},\
        \{ role:"user", content: "What is the capital of France?" \}\
      ],\
      temperature: 1.0,\
      top_p: 1.0,\
      model: model\
    \}\
  \});\
\
  if (isUnexpected(response)) \{\
    throw response.body.error;\
  \}\
\
  console.log(response.body.choices[0].message.content);\
\}\
\
main().catch((err) => \{\
  console.error("The sample encountered an error:", err);\
\});\
}