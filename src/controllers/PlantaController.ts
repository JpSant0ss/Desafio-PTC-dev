import { Request, Response } from "express";
import { Luminosidade, Prisma } from "@prisma/client";
import * as PlantaRepository from "@repositories/PlantaRepository";

const LUMINOSIDADES = ["SOMBRA", "MEIA_SOMBRA", "SOL_PLENO"];

//valida os dados recebidos, retorna null caso de certo ou mensagem de erro no oposto
const validarPlanta = (dados: any, exigirTodos: boolean): string | null => {
  const campos = ["nome", "especie", "preco", "estoque", "luminosidade", "petFriendly", "regaACadaDias"];

  if (exigirTodos) {
    for (const campo of campos) {
      if (dados[campo] === undefined) return `O campo ${campo} é obrigatório.`;
    }
  }

  const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = dados;

  if (nome !== undefined && (typeof nome !== "string" || nome.trim() === "")) {
    return "nome deve ser um texto não vazio.";
  }
  if (especie !== undefined && (typeof especie !== "string" || especie.trim() === "")) {
    return "especie deve ser um texto não vazio.";
  }
  if (preco !== undefined && (!Number.isInteger(preco) || preco <= 0)) {
    return "preco deve ser um inteiro maior que zero (em centavos).";
  }
  // estoque pode ser 0, só não pode ser negativo
  if (estoque !== undefined && (!Number.isInteger(estoque) || estoque < 0)) {
    return "estoque deve ser um inteiro maior ou igual a zero.";
  }
  if (luminosidade !== undefined && !LUMINOSIDADES.includes(luminosidade)) {
    return "luminosidade deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO.";
  }
  if (petFriendly !== undefined && typeof petFriendly !== "boolean") {
    return "petFriendly deve ser true ou false.";
  }
  if (regaACadaDias !== undefined && (!Number.isInteger(regaACadaDias) || regaACadaDias < 1)) {
    return "regaACadaDias deve ser um inteiro maior ou igual a 1.";
  }

  return null;
};

// O id chega da URL como texto. Devolve o número, ou null se não for um inteiro +.
const parseId = (valor: string): number | null => {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const createPlanta = async (req: Request, res: Response) => {
  try {
    const dados = req.body ?? {};

    // 400 bad request: dados faltando ou inválidos
    const erro = validarPlanta(dados, true);
    if (erro) {
      return res.status(400).json({ message: erro });
    }

    //vai de campo em campo para não conseguir enviar id, createdAt... sem sobrescrever o banco
    const planta = await PlantaRepository.createPlanta({
      nome: dados.nome,
      especie: dados.especie,
      preco: dados.preco,
      estoque: dados.estoque,
      luminosidade: dados.luminosidade,
      petFriendly: dados.petFriendly,
      regaACadaDias: dados.regaACadaDias,
    });

    // 201 created: algo novo foi criado
    return res.status(201).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao criar planta." });
  }
};

export const readAllPlantas = async (req: Request, res: Response) => {
  try {
    // filtros opcionais da URL: /plantas?luminosidade=SOMBRA&petFriendly=true
    const { luminosidade, petFriendly } = req.query;
    const where: Prisma.PlantaWhereInput = {};

    if (luminosidade !== undefined) {
      if (typeof luminosidade !== "string" || !LUMINOSIDADES.includes(luminosidade)) {
        return res.status(400).json({
          message: "luminosidade deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO.",
        });
      }
      where.luminosidade = luminosidade as Luminosidade;
    }

    if (petFriendly !== undefined) {
      // na URL tudo chega como texto: "true" não é o true booleano, então comparamos o texto
      if (petFriendly !== "true" && petFriendly !== "false") {
        return res.status(400).json({ message: "petFriendly deve ser true ou false." });
      }
      where.petFriendly = petFriendly === "true";
    }

    const plantas = await PlantaRepository.findAllPlantas(where);

    return res.status(200).json(plantas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar plantas." });
  }
};

export const readPlantaById = async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);

    if (id === null) {
      return res.status(400).json({ message: "id inválido." });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    // 404 not found: o id não existe
    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    return res.status(200).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar planta." });
  }
};

export const updatePlanta = async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);

    if (id === null) {
      return res.status(400).json({ message: "id inválido." });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    // 404 not found: o id não existe
    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    const dados = req.body ?? {};

    // exigirTodos = false: no PATCH nenhum campo é obrigatório
    const erro = validarPlanta(dados, false);
    if (erro) {
      return res.status(400).json({ message: erro });
    }

    // campos não enviados ficam undefined e o Prisma ignora na atualização
    // listar campo a campo impede que alguém altere id, createdAt etc
    const plantaAtualizada = await PlantaRepository.updatePlanta(id, {
      nome: dados.nome,
      especie: dados.especie,
      preco: dados.preco,
      estoque: dados.estoque,
      luminosidade: dados.luminosidade,
      petFriendly: dados.petFriendly,
      regaACadaDias: dados.regaACadaDias,
    });

    return res.status(200).json(plantaAtualizada);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao atualizar planta." });
  }
};

export const deletePlanta = async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);

    if (id === null) {
      return res.status(400).json({ message: "id inválido." });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    await PlantaRepository.deletePlanta(id);

    // 204 no content: deu certo e não há nada para devolver
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao deletar planta." });
  }
};