const fs = require('fs');
const yamlStr = `
  /custom-logo:
    post:
      operationId: createCustomLogo
      tags: [custom-logo]
      summary: Submit a custom logo design request
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CustomLogoRequestInput'
      responses:
        '201':
          description: Request created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  message:
                    type: string
                  id:
                    type: string
        '400':
          description: Validation error
        '500':
          description: Server error
`;
const compStr = `
    CustomLogoRequestInput:
      type: object
      properties:
        businessName:
          type: string
        slogan:
          type: string
        description:
          type: string
        industry:
          type: string
        targetAudience:
          type: string
        top3Things:
          type: array
          items:
            type: string
        ideas:
          type: string
        colors:
          type: string
        styles:
          type: array
          items:
            type: string
        sliders:
          type: object
          properties:
            feminineMasculine:
              type: number
            simpleComplex:
              type: number
            grayColorful:
              type: number
            subtleBright:
              type: number
            quietLoud:
              type: number
            necessityLuxury:
              type: number
            expensiveEconomical:
              type: number
            playfulSerious:
              type: number
            modernClassic:
              type: number
            rawRefined:
              type: number
            exoticCommonplace:
              type: number
            sportyElegant:
              type: number
            adventureSecure:
              type: number
        paymentId:
          type: string
        uploadLinks:
          type: array
          items:
            type: string
      required:
        - businessName
        - description
        - industry
        - targetAudience
        - top3Things
        - colors
        - styles
        - sliders
        - paymentId
`;

let file = fs.readFileSync('openapi.yaml', 'utf8');
if (!file.includes('/custom-logo:')) {
  file = file.replace('components:', yamlStr + '\ncomponents:');
  file += '\n' + compStr;
  fs.writeFileSync('openapi.yaml', file);
  console.log('Updated openapi.yaml');
}
