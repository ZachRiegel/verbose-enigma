import {create} from "zustand";
import {immer} from 'zustand/middleware/immer'
import {CardInfo} from "src/types";


type State = {
  cards: {
    [set: string]: {
      [collectorNumber: string]: CardInfo;
    }
  }
}

type Actions = {
  loadCardBySetId: (set: string, id: string) => Promise<CardInfo>;
}

const SCRYFALL_SERVICE_URL = "https://api.scryfall.com";

type RequestObj = {
  partial: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: Object
}

const request = (obj: RequestObj) => <T extends Object>() =>
  fetch(
    `${SCRYFALL_SERVICE_URL}${obj.partial}`,
    {
      method: obj.method,
      body: obj.data ? JSON.stringify(obj.data) : undefined,
    })
    .then((result) => {
        if (result.status === 200) return result.json() as Promise<T>;
        throw result;
      }
    );

const useCardInfo = create<State & Actions>()(
  immer(mutate => ({
    cards: {},
    loadCardBySetId: async (set, id) => {
      const card = await request({
        partial: `/card/${set}/${id}`,
        method: 'GET',
      })<CardInfo>();
      mutate(state => {
        state.cards[set][id] = card;
      });
      return card;
    },
  }))
)