export default class HistoriaScene extends Phaser.Scene {
    constructor() {
        super('HistoriaScene');
    }

    create() {
        const historia = [
            "El yatiri canta suavemente de rodillas, ofreciendo un sullu de llama sobre una ko’a...",
            "La ñusta está a su lado, cansada. El padre susurra: 'Pachamama, qhawaykuwayku'...",
            "El cielo se oscurece, el viento sopla frío... La tierra tiembla...",
            "La ñusta ve sus manos cambiar, su piel se arruga, sus trenzas se vuelven grises...",
            "Padre: 'Perdóname waway, es mi culpa... vendí la tierra a los narcos...'",
            "La Pachamama ha cobrado su precio."
        ];

        let index = 0;
        let texto = this.add.text(100, 600, historia[index], {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#fff',
            wordWrap: { width: 1080 }
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            index++;
            if (index < historia.length) {
                texto.setText(historia[index]);
            } else {
                this.scene.start('Level1');
            }
        });

        this.add.text(1000, 680, '[ESPACIO] para continuar', {
            fontSize: '18px',
            color: '#ccc'
        });
    }
}
