import { exibirModal } from "./modal.js";

export class ImageUploadManager {
    constructor({imagemConteiner, imagem, imagemNome, carregarImagemInput, carregarImagemBtn, wrapper}) {

        // properties básicas da ImageUploadManager
        this.imagemConteiner = imagemConteiner;
        this.imagem = imagem;
        this.imagemNome = imagemNome;
        this.carregarImagemInput = carregarImagemInput;
        this.carregarImagemBtn = carregarImagemBtn;
        this.wrapper = wrapper;
        this.imgFile = null;

        // setup
        this.setupListeners();
    }

    async processarImagem() {

        if (this.imgFile) {

            const arquivoValido = this.validarArquivo(this.imgFile);

            if (arquivoValido) {
                try {
                    const imgObj = await this.lerArquivo(this.imgFile);
                    this.alterarImagem(imgObj);
                } catch (error) {
                    console.log(error);
                }
            }
        }

        this.carregarImagemInput.value = "";
    }

    validarArquivo(arquivo) {

        // Verifica se a imagem é realmente um jpg ou png
        const listaTiposValidos = ["image/jpg", "image/jpeg", "image/png"];
        if (!listaTiposValidos.includes(arquivo.type)) {
            exibirModal({
                tipo: "erro",
                titulo: "Arquivo inválido",
                mensagem: "O arquivo inserido é inválido.\nPor favor, selecione somente imagens do tipo PNG ou JPG.",
            })
            return false;
        }

        // Verifica se a imagem é maior que 2MB
        if (arquivo.size > 2 * 1024 * 1024) {
            exibirModal({
                tipo: "erro",
                titulo: "Tamanho de imagem inválido",
                mensagem: "O tamanho da imagem inserida é muito grande.\nPor favor, selecione somente imagens de tamanho menor ou igual a 2MB.",
            })
            return false;
            }

        return true;
    }

    lerArquivo(arquivo) {

        return new Promise((resolve, reject) => {
            const leitor = new FileReader();

            leitor.onload = () => {
                resolve({url: leitor.result, nome: arquivo.name});
            }

            leitor.onerror = () => {
                reject(`Houve uma falha durante a leitura do arquivo ${arquivo.name}`);
            }
            
            leitor.readAsDataURL(arquivo);
        }) 
    }

    alterarImagem(img) {

        // Imagem
        this.imagem.src = img.url;
        this.imagemConteiner.classList.remove("hidden");
        this.carregarImagemBtn.classList.remove("entrada-suave");
        this.carregarImagemBtn.classList.add("hidden");

        // Nome da imagem
        this.imagemNome.querySelector("span").textContent = img.nome;
        this.imagemNome.classList.remove("hidden");
    }

    removerImagem() {
    
        this.imagem.src = "";
        this.imgFile = null;
        this.imagemNome.classList.add("hidden");
        this.imagemConteiner.classList.add("hidden");
        this.carregarImagemBtn.classList.add("entrada-suave");
        this.carregarImagemBtn.classList.remove("hidden");
    }

    setupListeners() {
        this.carregarImagemBtn.addEventListener("click", () => this.carregarImagemInput.click());
        
        this.carregarImagemBtn.addEventListener("dragover", (event) => {
            event.preventDefault();
        
            this.carregarImagemBtn.classList.add("area-imagem--foco");
        });
        
        this.carregarImagemBtn.addEventListener("dragleave", () => {
            this.carregarImagemBtn.classList.remove("area-imagem--foco");
        });
        
        this.carregarImagemBtn.addEventListener("drop", (event) => {
            event.preventDefault();
            this.carregarImagemBtn.classList.remove("area-imagem--foco");
        
            this.imgFile = event.dataTransfer.files[0];
            
            this.processarImagem();
        });
        
        this.carregarImagemInput.addEventListener("change", async (event) => {
        
            this.imgFile = event.target.files[0];
            
            this.processarImagem();
        });

        this.wrapper.addEventListener("click", (event) => {

            const elementoClicado = event.target;
            
            if (elementoClicado.closest(".remover-wrapper")) {
                this.removerImagem();
            }     
        })
    }
}