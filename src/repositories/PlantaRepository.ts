import { Prisma } from "@prisma/client";
import prisma from "@database";

export const createPlanta = async (data: Prisma.PlantaCreateInput) => {
    return await prisma.planta.create({
        data: data,
    });
};


export const findAllPlantas = async (where?: Prisma.PlantaWhereInput) => {
    return await prisma.planta.findMany({
        where: where, //é opcional caso queira filtrar as plantas
    });
};

export const findPlantaById = async (id: number) => {
    return await prisma.planta.findUnique({
        where: { id: id }
    });
};

export const updatePlanta = async (id: number, data: Prisma.PlantaUpdateInput) => {
    return await prisma.planta.update({
        where: { id: id },
        data: data,
    });
};

export const deletePlanta = async (id: number) => {
    return await prisma.planta.delete({
        where: { id: id }
    });
};

// desconta o estoque só se ainda houver quantidade suficiente
// devolve quantas linhas foram alteradas: 1 = vendeu, 0 = estoque insuficiente.
export const decrementEstoque = async (id: number, quantidade: number) => {
    const resultado = await prisma.planta.updateMany({
        where: { id: id, estoque: { gte: quantidade } },
        data: { estoque: { decrement: quantidade } },
    });
    return resultado.count;
};

// so preco e estoque
export const findPrecoEEstoque = async () => {
    return await prisma.planta.findMany({
        select: { preco: true, estoque: true },
    });
};