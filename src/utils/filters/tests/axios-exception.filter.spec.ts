import { AxiosError } from 'axios';
import { AxiosExceptionFilter } from '../axios-exception.filter';

type SutOutput = {
  sut: AxiosExceptionFilter;
};

const makeSut = (): SutOutput => {
  const sut = new AxiosExceptionFilter();
  return {
    sut,
  };
};

describe('AxiosExceptionFilter', () => {
  it('should call logger.error with 400 status code', () => {
    const { sut } = makeSut();
    const loggerSpy = jest.spyOn(sut['logger'], 'error');
    const exception = {
      response: {
        status: 400,
      },
    } as AxiosError;
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        }),
        getRequest: () => ({
          body: {
            firstProfile: 'any_id',
            secondProfile: 'other_id',
            advanced: false,
          },
        }),
      }),
    };
    sut.catch(exception, host as any);
    expect(loggerSpy).toHaveBeenCalledWith(
      `User had a 400 error comparing profiles any_id and other_id with advanced being false.`,
    );
  });

  it('should call logger.error with 404 status code', () => {
    const { sut } = makeSut();
    const loggerSpy = jest.spyOn(sut['logger'], 'error');
    const exception = {
      response: {
        status: 404,
      },
    } as AxiosError;
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        }),
        getRequest: () => ({
          body: {
            firstProfile: 'any_id',
            secondProfile: 'other_id',
            advanced: false,
          },
        }),
      }),
    };
    sut.catch(exception, host as any);
    expect(loggerSpy).toHaveBeenCalledWith(
      `User had a 404 error comparing profiles any_id and other_id with advanced being false.`,
    );
  });

  it('should call logger.error with 429 status code', () => {
    const { sut } = makeSut();
    const loggerSpy = jest.spyOn(sut['logger'], 'error');
    const exception = {
      response: {
        status: 429,
      },
    } as AxiosError;
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        }),
        getRequest: () => ({
          body: {
            firstProfile: 'any_id',
            secondProfile: 'other_id',
            advanced: false,
          },
        }),
      }),
    };
    sut.catch(exception, host as any);
    expect(loggerSpy).toHaveBeenCalledWith(
      `User had a 429 error comparing profiles any_id and other_id with advanced being false.`,
    );
  });

  it('should call logger.error with 500 status code', () => {
    const { sut } = makeSut();
    const loggerSpy = jest.spyOn(sut['logger'], 'error');
    const exception = {
      response: {
        status: 500,
      },
      stack: 'any_stack',
    } as AxiosError;
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        }),
        getRequest: () => ({
          body: {
            firstProfile: 'any_id',
            secondProfile: 'other_id',
            advanced: false,
          },
        }),
      }),
    };
    sut.catch(exception, host as any);
    expect(loggerSpy).toHaveBeenCalledWith(
      `User had a 500 error comparing profiles any_id and other_id with advanced being false.`,
    );
  });
});
