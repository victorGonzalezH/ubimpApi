import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BrandModel } from '@ubd/ubimp.domain/models/brand-model.model';
import { Brand } from '@ubd/ubimp.domain/models/brand.model';
import { Device } from '@ubd/ubimp.domain/models/devices/device.model';
import { User } from '@ubd/ubimp.domain/models/user.model';
import { VehicleGroup } from '@ubd/ubimp.domain/models/vehicle-group.model';
import { Vehicle } from '@ubd/ubimp.domain/models/vehicle.model';
import { BrandsRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/brands-repository/brands-repository.service';
import { DevicesRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/devices-repository/devices-repository.service';
import { MessagesRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/messages.repository.service';
import { VehicleGroupRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/vehicle-group-repository/vehicle-group-repository.service';
import { VehiclesRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/vehicle-repository/vehicles-repository.service';
import { String } from 'aws-sdk/clients/batch';
import { filter } from 'rxjs/operators';
import { ApplicationBaseService } from 'uba/ubimp.application/application-base.service';
import { AppConfigService } from 'uba/ubimp.application/config/appConfig.service';
import { VehicleDto } from 'uba/ubimp.application/dataTransferObjects/vehicle.dto';
import { VehicleGroupDto } from 'uba/ubimp.application/dataTransferObjects/vehicleGroup.dto';
import { CallSources } from 'uba/ubimp.application/enums/callSources.enum';
import { UserStatus } from 'uba/ubimp.application/usecases/CreateOnVerificationUser/userStatus.enum';
import { DevicesApplication } from 'uba/ubimp.application/usecases/devices/devices.application.service';
import { SaveVehicleCommand } from 'uba/ubimp.application/usecases/vehicles/commands/save-vehicle-command';
import { UpdateVehicleCommand } from 'uba/ubimp.application/usecases/vehicles/commands/update-vehicle-command';
import { VehicleCommandToDomainMapping } from 'uba/ubimp.application/usecases/vehicles/commands/vehicle-command-to-domain.mapping';
import { OnDeleteGroupCase } from 'uba/ubimp.application/usecases/vehicles/on-delete-group.case';
import { OnDeleteVehicleCase } from 'uba/ubimp.application/usecases/vehicles/on-delete-vehicle.case';
import { OnSaveVehicleUseCase } from 'uba/ubimp.application/usecases/vehicles/on-save-vehicle.case';
import { ApiResultBase, ApiResultBaseDto, AppInternalServerError, AppNotFoundException } from 'utils';
import { Langs } from 'utils/dist/application/Enums/langs.enum';

@Injectable()
export class VehiclesApplication extends ApplicationBaseService {
    
    
    /**
     * 
     * @param vehiclesRepository 
     * @param vehicleGroupRepository 
     */
    constructor(
        messagesRepository: MessagesRepository,
        appConfigService: AppConfigService,
        @Inject('USERS_SERVICE') usersClient: ClientProxy,
        private vehiclesRepository: VehiclesRepository,
        private vehiclesGroupsRepository: VehicleGroupRepository,
        private devicesRepository: DevicesRepository,
        private brandsRepository: BrandsRepository,
        private devicesApp: DevicesApplication) {
        super(messagesRepository, appConfigService, usersClient);
    }


    /**
     * 
     * @param username 
     * @param langParam 
     * @returns 
     */
    public async getVehiclesGroupsWithVehiclesByUsername(username: string, langParam?: string): Promise<ApiResultBaseDto> {
        const lang: Langs = this.converToLanguageFromString(langParam);
        const pattern = { command: 'getByUsername' };
        const getUserByNamePayLoad = { username: username, systemId: this.appConfigService.getSystemId(), callSource: CallSources.Microservice };
        try {
           
            // We get the user from the users microservice
            const userFound: User = await this.usersClient.send(pattern, getUserByNamePayLoad).toPromise();
            //Definig the owner id
            const ownerId: string = userFound.ownerId != null? userFound.ownerId: userFound._id;
            const userIdfilter = { userId: userFound._id };
            const ownerIdFilter = { ownerId: ownerId };
            // we get the vehicles by its owner
            const vehicles = await this.vehiclesRepository.getAllByFilter(ownerIdFilter);
            // We get the vehicle groups by its userId
            const vehiclesGroups = await this.vehiclesGroupsRepository.getAllByFilter(userIdfilter);
            
            const vehiclesGroupDto: VehicleGroupDto[]  = [];
            // For every vehicle group
            vehiclesGroups.forEach(vehicleGroup => {

                const vehiclesDto: VehicleDto[] = [];
                // for every vehicle id in the vehicle group

                vehicleGroup.vehiclesIds.forEach(async lvids => {
                    const vehiclesFound = vehicles.filter(lv => lv._id == lvids);
                    
                    if(vehiclesFound != null && vehiclesFound != undefined && vehiclesFound.length > 0) {
                        
                        const vehicleFound = vehiclesFound[0];
                        let vehicleDto: VehicleDto = null;
                        if(vehicleFound.brandId) {
                                vehicleDto = await this.convertVehicleToDto(vehicleFound, vehicleGroup.name);
                        } else {
                            
                            const brandsFilter = { _id: vehicleFound.brandId };
                            const brandsFound = await this.brandsRepository.getWithModels(brandsFilter);
                            if(brandsFound != null && brandsFound.length > 0) {
                                const brandFound = brandsFound[0];
                                const modelFound = brandFound.models.filter(model => {
                                    model._id == vehicleFound.modelId
                                })[0];

                                vehicleDto = await this.convertVehicleToDto(vehicleFound, vehicleGroup.name, brandFound, modelFound);
                            }

                            
                        }

                        vehiclesDto.push(vehicleDto);
                    } 
                });

                
            
                vehiclesGroupDto.push({ id: vehicleGroup._id, name: vehicleGroup.name, order: 1, vehicles: vehiclesDto });
            });

            return this.generateCustomSuccessApiResultBase(vehiclesGroupDto, ApiResultBase.UM_SUCCESS, ApiResultBase.AM_SUCCESS, ApiResultBase.SUCCESS_CODE, lang as Langs);

           } catch (exception) {
            return this.generateCustomErrorApiResultBase(exception, ApiResultBase.UM_ERROR, ApiResultBase.AM_INTERNAL_ERROR, ApiResultBase.ERROR_CODE, lang as Langs)
        }
    }

    /**
     * 
     * @param properties 
     */
    public async getVehiclesTypesByProperties(properties: Array<{ name: string, value: string }>): Promise<ApiResultBaseDto>
    {
        return null;
    }


    /**
     * Inserts a vehicle document into the database
     * @param name 
     * @param ownerId 
     * @param deviceId 
     * @param objectTypeId 
     * @param brandId 
     * @param modelId 
     * @param licensePlate 
     * @param year 
     */
    private async insertVehicle(name: string, ownerId: string, deviceId: string, objectTypeId: string, description: string, brandId ?: string, modelId?: string, licensePlate?: string, year?: string)
    {
        try 
        {
            const newVehicle: Vehicle = new Vehicle(name, ownerId, deviceId, objectTypeId, description, brandId, modelId, licensePlate, year);
            const savedVehicle = await this.vehiclesRepository.save(newVehicle);
            return savedVehicle;
        }
        catch(exception) 
        {
            throw exception;
        }
    }


    /**
     * Converts a vehicle domain class object to a vehicle data transfer object
     * @param vehicle Vehicle domain object to convert
     */
    private async convertVehicleToDto(vehicle: Vehicle, vehicleGroupName: string, brand?: Brand, model?: BrandModel): Promise<VehicleDto>
    {
        try {

            if( (brand == undefined && model == undefined) && (vehicle.brandId != undefined && vehicle.modelId != undefined))
            {
                const foundBrands: Brand[] = await this.brandsRepository.getAll();
                const brands = foundBrands.filter( b => b._id == vehicle.brandId);
                if(brands != null && brands.length > 0)  {
                    brand = brands[0];
                    const foundModels = brand.models.filter(m => m._id == vehicle.modelId);
                    if(foundModels != null && foundModels.length > 0) {
                        model = foundModels[0];
                    }
                    else throw new AppInternalServerError(OnSaveVehicleUseCase.ERROR_MODEL_NOT_FOUND_ON_SAVING_VEHICLE.message); //for now this case will rise an exception
                    
                } else throw new AppInternalServerError(OnSaveVehicleUseCase.ERROR_BRAND_NOT_FOUND_ON_SAVING_VEHICLE.message); //for now this case will rise an exception
            }
            
                const vehicleDto: VehicleDto
                                    = { 
                                        name: vehicle.name,
                                        objectTypeId: vehicle.objectTypeId,
                                        description: vehicle.description,
                                        licensePlate: vehicle.licensePlate != undefined ? vehicle.licensePlate: undefined,
                                        year: vehicle.year != undefined ? vehicle.year: undefined,
                                        brand: vehicle.brandId != undefined ? brand.displayName : undefined,
                                        model: vehicle.modelId != undefined? model.displayName: undefined,
                                        vehicleGroupName: vehicleGroupName };

                return vehicleDto;
            }
        catch(exception) {
            throw exception;
        }
    }


    /**
     * 
     * @param saveVehicleCommand Command for saving a vehicle
     * @returns A ApiResultBase with the new saved vehicle dto
     */
    async saveVehicle(saveVehicleCommand: SaveVehicleCommand): Promise<ApiResultBaseDto> {
        try 
        {
            
            //First thing we have to do is to find the user, if it doesnt exist
            //throws an exception
            const user: User = await this.getUser(saveVehicleCommand.username);
            if(user != undefined && user != null)
            {
                //We have to find the device, (this should be avalilabe for asigment)
                const deviceFilter = { imei: saveVehicleCommand.imei };
                const devices: Device[] = await this.devicesRepository.getAllByFilter(deviceFilter);
                const device: Device = devices != null && devices.length > 0 ? devices[0]: null;
                if(device != null)
                {
                    //Due thats a vehicle/person/location has to be in a group
                    //we have to check if the group exist, in other case, we
                    //have to create it
                    const vehicleGroupFilter = { userId: user._id };
                    const vehicleGroups: VehicleGroup[] = await this.vehiclesGroupsRepository.getAllByFilter(vehicleGroupFilter);
                    let vehicleGroup = vehicleGroups.filter( vg => vg.name === saveVehicleCommand.vehicleGroupName) != null ? vehicleGroups.filter( vg => vg.name === saveVehicleCommand.vehicleGroupName)[0]: null;
                    
                    //If null we have to create the group
                    if(vehicleGroup == null) 
                    {
                        const newVehicleGroup: VehicleGroup = new VehicleGroup(saveVehicleCommand.vehicleGroupName, user._id, vehicleGroups.length + 1);
                        vehicleGroup = await this.vehiclesGroupsRepository.save(newVehicleGroup);
                    } 
                    
                    let savedVehicle = null;
                    let brand: Brand = null;
                    let model: BrandModel = null;
                    const ownerId = user.ownerId != null ? user.ownerId: user._id;
                    //Finding the brand in case the vehicle is a type of car, truck, pickup etc
                    if(saveVehicleCommand.brand != undefined)
                    {
                        const brandFilter = { displayName: saveVehicleCommand.brand };
                        const brands: Brand[] = await this.brandsRepository.getAllByFilter(brandFilter);
                        brand =  brands.filter( b => b.displayName === saveVehicleCommand.brand) != null ? brands.filter( b => b.displayName === saveVehicleCommand.brand)[0]: null;
                        if(brand != null) 
                        {
                            const models: BrandModel[] = brand.models.filter(bm => bm.displayName === saveVehicleCommand.model);
                            model = models != null && models.length > 0 ? models[0]: null;
                            if(model != null) {
                                
                                const name = saveVehicleCommand.name != null ? saveVehicleCommand.name : brand.displayName + ' ' + model.displayName + ' ' + saveVehicleCommand.licensePlate;
                                
                                //Just to note that the save method returns a <T & Document> array
                                savedVehicle = await this.insertVehicle(name, ownerId, device._id, saveVehicleCommand.objectTypeId, saveVehicleCommand.description, brand._id, model._id, saveVehicleCommand.licensePlate, saveVehicleCommand.year);

                            }
                            else 
                            {
                                return this.generateCustomErrorApiResultBase(new AppNotFoundException(OnSaveVehicleUseCase.ERROR_MODEL_NOT_FOUND_ON_SAVING_VEHICLE.message),
                                OnSaveVehicleUseCase.ERROR_MODEL_NOT_FOUND_ON_SAVING_VEHICLE.userMessageCode, OnSaveVehicleUseCase.ERROR_MODEL_NOT_FOUND_ON_SAVING_VEHICLE.message, OnSaveVehicleUseCase.ERROR_MODEL_NOT_FOUND_ON_SAVING_VEHICLE.code, saveVehicleCommand.lang);
                            }
                        }
                        else 
                        {
                            return this.generateCustomErrorApiResultBase(new AppNotFoundException(OnSaveVehicleUseCase.ERROR_BRAND_NOT_FOUND_ON_SAVING_VEHICLE.message),
                            OnSaveVehicleUseCase.ERROR_BRAND_NOT_FOUND_ON_SAVING_VEHICLE.userMessageCode, OnSaveVehicleUseCase.ERROR_BRAND_NOT_FOUND_ON_SAVING_VEHICLE.message, OnSaveVehicleUseCase.ERROR_BRAND_NOT_FOUND_ON_SAVING_VEHICLE.code, saveVehicleCommand.lang);
                        }
                    }
                    else 
                    {
                        savedVehicle = await this.insertVehicle(saveVehicleCommand.name, ownerId, device._id, saveVehicleCommand.objectTypeId, saveVehicleCommand.description);
                    }

                
                    if(savedVehicle != null)
                    {   
                        // We must to add the Id of the saved vehicle to its vehicle group
                        const updateVehicleGroupfilter = { _id: vehicleGroup._id };
                        vehicleGroup.vehiclesIds.push(savedVehicle._id);
                        await this.vehiclesGroupsRepository.update(updateVehicleGroupfilter, { vehiclesIds: vehicleGroup.vehiclesIds });
                        
                        //We must to set to true to the device availability
                        const updateDeviceFilter = { _id: device._id };
                        await this.devicesRepository.update(updateDeviceFilter, { isAssigned: true } );
                        
                        const vehicleDto: VehicleDto = await this.convertVehicleToDto(savedVehicle, vehicleGroup.name, brand, model);
                        return this.generateCustomSuccessApiResultBase(vehicleDto, ApiResultBase.UM_SUCCESS, ApiResultBase.AM_SUCCESS, ApiResultBase.SUCCESS_CODE, saveVehicleCommand.lang);
                    }
                    else 
                    {
                        return this.generateCustomErrorApiResultBase(new AppNotFoundException(OnSaveVehicleUseCase.ERROR_SAVING_VEHICLE_ON_SAVING_VEHICLE.message),
                        OnSaveVehicleUseCase.ERROR_SAVING_VEHICLE_ON_SAVING_VEHICLE.userMessageCode, OnSaveVehicleUseCase.ERROR_SAVING_VEHICLE_ON_SAVING_VEHICLE.message, OnSaveVehicleUseCase.ERROR_SAVING_VEHICLE_ON_SAVING_VEHICLE.code, saveVehicleCommand.lang);
                    }
                
                }
                else
                {   
                    return this.generateCustomErrorApiResultBase(new AppNotFoundException(OnSaveVehicleUseCase.ERROR_DEVICE_NOT_FOUND_ON_SAVING_VEHICLE.message),
                            OnSaveVehicleUseCase.ERROR_DEVICE_NOT_FOUND_ON_SAVING_VEHICLE.userMessageCode, OnSaveVehicleUseCase.ERROR_DEVICE_NOT_FOUND_ON_SAVING_VEHICLE.message, OnSaveVehicleUseCase.ERROR_DEVICE_NOT_FOUND_ON_SAVING_VEHICLE.code, saveVehicleCommand.lang);
                }
            }
            else
            {
                return this.generateCustomErrorApiResultBase(new AppNotFoundException(OnSaveVehicleUseCase.ERROR_USER_NOT_FOUND_ON_SAVING_VEHICLE.message),
                OnSaveVehicleUseCase.ERROR_USER_NOT_FOUND_ON_SAVING_VEHICLE.userMessageCode, OnSaveVehicleUseCase.ERROR_USER_NOT_FOUND_ON_SAVING_VEHICLE.message, OnSaveVehicleUseCase.ERROR_USER_NOT_FOUND_ON_SAVING_VEHICLE.code, saveVehicleCommand.lang);
            }
        }
        catch(exception) 
        { 
            return this.generateCustomErrorApiResultBase(exception,
                ApiResultBase.UM_ERROR, ApiResultBase.AM_INTERNAL_ERROR, ApiResultBase.ERROR_CODE, saveVehicleCommand.lang);
        }
      }

      

      /**
       * 
       * @param vehicleName 
       * @param updateVehicleCommand 
       */
      async updateVehicle(vehicleName: string, updateVehicleCommand: UpdateVehicleCommand) {

        try {

            const lang: Langs = updateVehicleCommand.lang as Langs;
            
            //Map command to domain object
                //Apply transformation to the properties in case they needs
            //update the domain object
            //Apply business logic for the 

            
            // if(updateVehicleCommand.imei != undefined) {
            //     const vehicle = await this.vehiclesRepository.getOneByFilter({ name: vehicleName });
            //     if(vehicle != null && vehicle != undefined) {
                    
            //     }
            // }
            
            const user: User = await this.getUser(updateVehicleCommand.username);
            
            if(user != undefined && user != null)
            {

            }

            // device Id transform function
            let deviceIdTransformFunc = async (parameters: { imei: string }): Promise<string> => {
                const device = await this.devicesApp.getDeviceByImei(parameters.imei);
                return device != null && device != undefined? device._id: null;
            };

            //Model Id transform function
            const modelIdTransformFunc = async (parameters: { modelName: string }): Promise<string> => {
                const brands = await this.brandsRepository.getAll();
                for(let index = 0; index < brands.length; index) {
                    let models = brands[index].models.filter( m => m.displayName === parameters.modelName);
                    if(models != null && models != undefined && models.length > 0) {
                        return models[0]._id
                    } ;
                } 
                
                return null;
            };

            //Brand Id transform function
            let brandIdTransformFunc = async (parameters: { brandName: string }): Promise<string> => {
                const brand = await this.brandsRepository.getOneByFilter({ displayName: parameters.brandName });
                return brand != null && brand != undefined ? brand._id: null;
            };
            
            const vehicleUpdatePart =  await 
                                       this.fromCommandToDomainObject
                                       (updateVehicleCommand, 
                                        Vehicle.createMockObject(),
                                        [ { commandProperty: 'imei', domainSustitutionProperty: 'deviceId', transform: deviceIdTransformFunc, transformParams:  { imei: updateVehicleCommand.imei } },
                                          { commandProperty: 'model', domainSustitutionProperty: 'modelId', transform: modelIdTransformFunc, transformParams:  { modelName: updateVehicleCommand.model } },
                                          { commandProperty: 'brand', domainSustitutionProperty: 'brandId', transform: brandIdTransformFunc, transformParams: { brandName: updateVehicleCommand.brand } }
                                        ])
            
            const vehicleFilter = { 'name': vehicleName };
            const vehicleUpdated = await this.vehiclesRepository.update(vehicleFilter, vehicleUpdatePart, true);
            const vehicleGroup = this.vehiclesGroupsRepository.getOneByFilter({  });
            //const vehicleDto: VehicleDto = await this.convertVehicleToDto(vehicleUpdated, );
            //return this.generateCustomSuccessApiResultBase()

            return true;
        }
        catch(exception) {
            
        }

      }


      /**
       * Delete a vehicle
       * @param vehicleName 
       * @param lang 
       */
      async deleteVehicle(vehicleName: string, groupname: string, langParam: string): Promise<ApiResultBaseDto> {

        const lang: Langs = langParam as Langs;

        try {
            
            const vehicleFilter = { 'name':  vehicleName};
            const foundVehicles = await this.vehiclesRepository.getAllByFilter(vehicleFilter);
            if(foundVehicles != null && foundVehicles.length > 0) {
                
                const foundVehicle = foundVehicles[0];
                //We have to update the device avalability
                const updateDeviceFilter = { _id: foundVehicle.deviceId };
                await this.devicesRepository.update(updateDeviceFilter, { isAssigned: false } );

                //We have to remove the vehicles id from the vehicle group
                const vehiclesGroupFilter = { name: groupname };
                const vehiclesGroupsFound = await this.vehiclesGroupsRepository.getAllByFilter(vehiclesGroupFilter);
                if(vehiclesGroupsFound != null && vehiclesGroupsFound.length > 0) {
                    const vehicleGroup = vehiclesGroupsFound[0];
                    const vehiclesIdsUpdated = [];
                    vehicleGroup.vehiclesIds.forEach( vehicleid => {
                        if(vehicleid != foundVehicle._id) vehiclesIdsUpdated.push(vehicleid);
                    });
                    
                    const vehicleGroupUpdated = this.vehiclesGroupsRepository.update(vehiclesGroupFilter, { vehiclesIds: vehiclesIdsUpdated }, true);

                    //We proceed to delete the vehicle
                    const deleteResult = await this.vehiclesRepository.delete(vehicleFilter);
                    if(deleteResult.deletedCount > 0) {
                        return this.generateCustomSuccessApiResultBase(null, ApiResultBase.UM_SUCCESS, ApiResultBase.AM_SUCCESS, ApiResultBase.SUCCESS_CODE, lang);
                    }

                return this.generateCustomErrorApiResultBase(new AppNotFoundException(OnDeleteVehicleCase.ERROR_NO_DOCUMENT_DELETED_ON_DELETING_VEHICLE.message),
                    OnDeleteVehicleCase.ERROR_NO_DOCUMENT_DELETED_ON_DELETING_VEHICLE.userMessageCode, OnDeleteVehicleCase.ERROR_NO_DOCUMENT_DELETED_ON_DELETING_VEHICLE.message, OnDeleteVehicleCase.ERROR_NO_DOCUMENT_DELETED_ON_DELETING_VEHICLE.code, lang);
                } else {

                }
                
            } else {
                // Throws an error
            }
        }
        catch(exception) {

            return this.generateCustomErrorApiResultBase(exception,
                ApiResultBase.UM_ERROR, ApiResultBase.AM_INTERNAL_ERROR, ApiResultBase.ERROR_CODE, lang);
        }

      }


      /**
       * 
       * @param groupname Group name
       * @param langParam lang
       * @returns 
       */
      async deleteGroup(groupname: string, langParam: string) {
        
        const lang: Langs = langParam as Langs;

        try {
            if(groupname === 'default' || groupname === 'Default') return this.generateCustomErrorApiResultBase(new AppInternalServerError(OnDeleteGroupCase.ERROR_CAN_NOT_DELETE_DEFAULT_ON_DELETING_GROUP.message),
            OnDeleteGroupCase.ERROR_CAN_NOT_DELETE_DEFAULT_ON_DELETING_GROUP.userMessageCode, OnDeleteGroupCase.ERROR_CAN_NOT_DELETE_DEFAULT_ON_DELETING_GROUP.message, OnDeleteGroupCase.ERROR_CAN_NOT_DELETE_DEFAULT_ON_DELETING_GROUP.code, lang);
            const groupFilter = { name: groupname };
            const deleteResult = await this.vehiclesGroupsRepository.delete(groupFilter);
            if(deleteResult.deletedCount > 0) {
                return this.generateCustomSuccessApiResultBase(null, ApiResultBase.UM_SUCCESS, ApiResultBase.AM_SUCCESS, ApiResultBase.SUCCESS_CODE, lang);
            }

            return this.generateCustomErrorApiResultBase(new AppNotFoundException(OnDeleteGroupCase.ERROR_NO_DOCUMENT_DELETED_ON_DELETING_GROUP.message),
            OnDeleteGroupCase.ERROR_NO_DOCUMENT_DELETED_ON_DELETING_GROUP.userMessageCode, OnDeleteGroupCase.ERROR_NO_DOCUMENT_DELETED_ON_DELETING_GROUP.message, OnDeleteGroupCase.ERROR_NO_DOCUMENT_DELETED_ON_DELETING_GROUP.code, lang);

        }
         catch(exception) {

         }

      }
}
